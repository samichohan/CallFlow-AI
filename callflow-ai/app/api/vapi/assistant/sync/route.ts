// app/api/vapi/assistant/sync/route.ts
// Secure backend route to synchronize Vapi Assistant prompt, tools, and webhook URL.

import { NextRequest, NextResponse } from "next/server";
import { ASSISTANT_SYSTEM_PROMPT, CRM_TOOLS } from "@/lib/vapi";

export async function POST(req: NextRequest) {
  const privateKey = process.env.VAPI_PRIVATE_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  if (!privateKey || !assistantId) {
    return NextResponse.json(
      { error: "VAPI_PRIVATE_API_KEY or VAPI_ASSISTANT_ID missing." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isClientTools = body.clientTools ?? (!body.serverUrl && !process.env.VAPI_WEBHOOK_URL);
    const serverUrl = isClientTools ? null : (body.serverUrl || process.env.VAPI_WEBHOOK_URL || null);

    const toolsConfigured = CRM_TOOLS.map((tool) => {
      if (serverUrl) {
        return { ...tool, server: { url: serverUrl } };
      }
      return tool;
    });

    const updatePayload = {
      serverUrl,
      model: {
        provider: "groq",
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: ASSISTANT_SYSTEM_PROMPT,
          },
        ],
        tools: toolsConfigured,
      },
    };

    const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Vapi sync failed (${res.status}): ${err}` },
        { status: res.status }
      );
    }

    const updated = await res.json();
    return NextResponse.json({
      success: true,
      message: `Assistant '${updated.name}' synced with ${CRM_TOOLS.length} CRM tools & Server URL: ${serverUrl || "Client-Side (Web SDK)"}`,
      serverUrl: updated.serverUrl,
      tools: updated.model?.tools?.map((t: any) => t.function?.name),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync assistant with Vapi." },
      { status: 500 }
    );
  }
}
