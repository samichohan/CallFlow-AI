// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search") || "";
    const status    = searchParams.get("status") || "";
    const payment   = searchParams.get("payment") || "";
    const customerId = searchParams.get("customerId") || "";

    const where: any = {};
    if (status    && status !== "all")  where.status = status;
    if (payment   && payment !== "all") where.paymentStatus = payment;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { trackingNumber: { contains: search } },
        { customer: { fullName: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { items: { some: { productName: { contains: search } } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId, productName, quantity = 1, unitPrice,
      deliveryMethod = "standard", deliveryAddress, notes,
    } = body;

    if (!customerId)   return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    if (!productName)  return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    if (!unitPrice)    return NextResponse.json({ error: "Unit price is required" }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const count = await prisma.order.count();
    const orderNumber = `ORD-${(2000 + count + 1).toString().padStart(4, "0")}`;
    const totalAmount = parseFloat(unitPrice) * parseInt(quantity);

    const order = await prisma.order.create({
      data: {
        customerId,
        orderNumber,
        status: "pending",
        paymentStatus: "unpaid",
        totalAmount,
        currency: "USD",
        deliveryMethod,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        items: {
          create: [{
            productName,
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            totalPrice: totalAmount,
          }],
        },
      },
      include: { customer: true, items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
