// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      status, paymentStatus, trackingNumber,
      carrier, estimatedDelivery, notes,
    } = body;

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(status        && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingNumber && { trackingNumber }),
        ...(carrier       && { carrier }),
        ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }),
        ...(notes         && { notes }),
        ...(status === "delivered" && { deliveredAt: new Date() }),
      },
      include: { customer: true, items: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete items first (cascade handled by Prisma)
    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete order" }, { status: 500 });
  }
}
