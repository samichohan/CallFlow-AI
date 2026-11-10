// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { subject, description, priority, status, category, customerId } = body;

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        ...(subject && { subject }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(category && { category }),
        ...(customerId !== undefined && { customerId: customerId || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supportTicket.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete ticket" }, { status: 500 });
  }
}

