// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        calls: {
          orderBy: { createdAt: "desc" },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { fullName, phone, email, company, status } = body;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete related orders, tickets and calls first
    await prisma.orderItem.deleteMany({ where: { order: { customerId: params.id } } });
    await prisma.order.deleteMany({ where: { customerId: params.id } });
    await prisma.supportTicket.deleteMany({ where: { customerId: params.id } });
    await prisma.call.deleteMany({ where: { customerId: params.id } });

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Customer and related records deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete customer" }, { status: 500 });
  }
}

