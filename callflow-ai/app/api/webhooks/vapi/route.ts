// app/api/webhooks/vapi/route.ts
// Secure Vapi Webhook Server for tool calls, transcripts, and end-of-call reports.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeTool } from "@/lib/tools";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const message = body.message || body;
    const type = message.type;
    const call = message.call || {};
    const vapiCallId = call.id || message.callId || `call-${Date.now()}`;

    // Audit log webhook event in background
    try {
      await prisma.webhookEvent.create({
        data: {
          vapiCallId,
          eventType: type || "unknown",
          payload: rawBody.slice(0, 5000),
          processed: true,
        },
      });
    } catch (e) {
      // non-fatal
    }

    // ─────────────────────────────────────────────
    // 1. TOOL CALLS HANDLER (Standard Vapi tool-calls)
    // ─────────────────────────────────────────────
    if (type === "tool-calls") {
      const toolCallList = message.toolCalls || message.toolCallList || [];
      const results = [];

      for (const tc of toolCallList) {
        const name = tc.function?.name || tc.name;
        let args: any = {};
        try {
          args = typeof tc.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments || {};
        } catch {
          args = {};
        }

        console.log(`[Vapi Webhook] Executing tool: ${name} with args:`, args);

        const toolResult = await executeTool(name, args);

        results.push({
          toolCallId: tc.id,
          result: JSON.stringify(toolResult),
        });
      }

      return NextResponse.json({ results });
    }

    // ─────────────────────────────────────────────
    // 2. LEGACY FUNCTION CALL HANDLER
    // ─────────────────────────────────────────────
    if (type === "function-call") {
      const fc = message.functionCall || {};
      const name = fc.name;
      let args = fc.parameters || {};
      if (typeof args === "string") {
        try { args = JSON.parse(args); } catch {}
      }

      console.log(`[Vapi Webhook] Executing legacy function: ${name} with args:`, args);
      const toolResult = await executeTool(name, args);

      return NextResponse.json({
        result: JSON.stringify(toolResult),
      });
    }

    // ─────────────────────────────────────────────
    // 3. END OF CALL REPORT
    // ─────────────────────────────────────────────
    if (type === "end-of-call-report" || type === "call.ended") {
      const callData = message.call || {};
      const transcript = message.transcript || callData.transcript || "";
      const summary = message.summary || message.analysis?.summary || "";
      const durationSeconds = Math.round(message.durationSeconds || callData.duration || 0);
      const recordingUrl = message.recordingUrl || callData.recordingUrl || null;
      const customerNumber = callData.customer?.number || message.customer?.number || null;

      let matchedCustomerId: string | null = null;
      if (customerNumber) {
        const cust = await prisma.customer.findUnique({ where: { phone: customerNumber } });
        if (cust) matchedCustomerId = cust.id;
      }

      await prisma.call.upsert({
        where: { vapiCallId },
        update: {
          status: "ended",
          duration: durationSeconds,
          transcript,
          summary,
          recordingUrl,
          outcome: "resolved",
          endedAt: new Date(),
          ...(matchedCustomerId && { customerId: matchedCustomerId }),
        },
        create: {
          vapiCallId,
          phoneNumber: customerNumber,
          customerId: matchedCustomerId,
          callType: "inbound",
          status: "ended",
          duration: durationSeconds,
          transcript,
          summary,
          recordingUrl,
          outcome: "resolved",
          startedAt: new Date(Date.now() - durationSeconds * 1000),
          endedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Call report saved" });
    }

    // ─────────────────────────────────────────────
    // 4. STATUS UPDATE
    // ─────────────────────────────────────────────
    if (type === "status-update") {
      const status = message.status;
      if (vapiCallId && status) {
        await prisma.call.upsert({
          where: { vapiCallId },
          update: { status },
          create: {
            vapiCallId,
            status,
            callType: "inbound",
            startedAt: new Date(),
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
