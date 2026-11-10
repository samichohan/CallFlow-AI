// app/api/calls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const callType = searchParams.get("callType") || "";

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (callType && callType !== "all") {
      where.callType = callType;
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search } },
        { summary: { contains: search } },
        { customer: { fullName: { contains: search } } },
      ];
    }

    const calls = await prisma.call.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(calls);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch calls" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      phoneNumber,
      callType = "demo",
      status = "initiated",
      duration = 0,
      transcript,
      summary,
      recordingUrl,
      outcome = "resolved",
      startedAt,
      endedAt,
      vapiCallId,
    } = body;

    let finalCustomerId = customerId;

    // If phone number is given without customerId, try to link with existing customer
    if (!finalCustomerId && phoneNumber) {
      const match = await prisma.customer.findUnique({
        where: { phone: phoneNumber },
      });
      if (match) finalCustomerId = match.id;
    }

    const call = await prisma.call.create({
      data: {
        vapiCallId: vapiCallId || null,
        customerId: finalCustomerId || null,
        phoneNumber: phoneNumber || null,
        callType,
        status,
        duration: duration ? Number(duration) : null,
        transcript: transcript || null,
        summary: summary || null,
        recordingUrl: recordingUrl || null,
        outcome: outcome || null,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : null,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record call" }, { status: 500 });
  }
}

