// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const category = searchParams.get("category") || "";

    const where: any = {};

    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (category && category !== "all") where.category = category;

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { description: { contains: search } },
        { customer: { fullName: { contains: search } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, subject, description, priority = "medium", status = "open", category = "general" } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and Description are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: customerId || null,
        subject,
        description,
        priority,
        status,
        category,
      },
      include: { customer: true },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}

