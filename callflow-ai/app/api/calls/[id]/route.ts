// app/api/calls/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch call" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, duration, transcript, summary, outcome, recordingUrl, endedAt } = body;

    const updated = await prisma.call.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(transcript !== undefined && { transcript }),
        ...(summary !== undefined && { summary }),
        ...(outcome !== undefined && { outcome }),
        ...(recordingUrl !== undefined && { recordingUrl }),
        ...(endedAt && { endedAt: new Date(endedAt) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update call" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.call.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Call record deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete call" }, { status: 500 });
  }
}

