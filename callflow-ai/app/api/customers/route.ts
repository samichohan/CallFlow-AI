// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            calls: true,
            supportTickets: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, company, status } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: "Full Name and Phone are required" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json({ error: "Customer with this phone number already exists" }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        email: email || null,
        company: company || null,
        status: status || "active",
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create customer" }, { status: 500 });
  }
}

