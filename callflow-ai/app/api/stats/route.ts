// app/api/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalCustomers,
      totalCalls,
      answeredCalls,
      missedCalls,
      callsWithDuration,
      totalTickets,
      resolvedTickets,
      pendingTickets,
      recentCalls,
      recentTickets,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.call.count(),
      prisma.call.count({ where: { status: "ended" } }),
      prisma.call.count({ where: { status: "missed" } }),
      prisma.call.aggregate({
        _avg: { duration: true },
        where: { duration: { not: null } },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "resolved" } }),
      prisma.supportTicket.count({ where: { status: { in: ["open", "in-progress"] } } }),
      prisma.call.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
      prisma.supportTicket.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
    ]);

    const avgCallDuration = Math.round(callsWithDuration._avg.duration || 0);

    // Activity breakdown over recent days
    const calls = await prisma.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const dayMap: Record<string, { total: number; answered: number; missed: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap[key] = { total: 0, answered: 0, missed: 0 };
    }

    calls.forEach((c) => {
      const key = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap[key]) {
        dayMap[key].total += 1;
        if (c.status === "ended") dayMap[key].answered += 1;
        if (c.status === "missed") dayMap[key].missed += 1;
      }
    });

    const chartData = Object.entries(dayMap).map(([date, data]) => ({
      date,
      total: data.total,
      answered: data.answered,
      missed: data.missed,
    }));

    return NextResponse.json({
      stats: {
        totalCustomers,
        totalCalls,
        answeredCalls,
        missedCalls,
        avgCallDuration,
        totalTickets,
        resolvedTickets,
        pendingTickets,
      },
      chartData,
      recentCalls,
      recentTickets,
    });
  } catch (error: any) {
    console.error("Failed to load statistics:", error);
    return NextResponse.json({ error: error.message || "Failed to load stats" }, { status: 500 });
  }
}

