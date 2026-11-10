"use client";
// components/dashboard/StatsCards.tsx
import { Users, Phone, PhoneCall, PhoneMissed, Clock, Ticket, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCallDuration } from "@/lib/utils";
import { DashboardStats } from "@/types";

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      subtext: "Verified contacts in CRM",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Calls",
      value: stats.totalCalls.toLocaleString(),
      subtext: "Inbound & outbound total",
      icon: Phone,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Answered Calls",
      value: stats.answeredCalls.toLocaleString(),
      subtext: `${stats.totalCalls ? Math.round((stats.answeredCalls / stats.totalCalls) * 100) : 0}% answer rate`,
      icon: PhoneCall,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Missed Calls",
      value: stats.missedCalls.toLocaleString(),
      subtext: "Requires callback review",
      icon: PhoneMissed,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "Avg Call Duration",
      value: formatCallDuration(stats.avgCallDuration),
      subtext: "Resolution efficiency",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Total Tickets",
      value: stats.totalTickets.toLocaleString(),
      subtext: "Across all categories",
      icon: Ticket,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Resolved Tickets",
      value: stats.resolvedTickets.toLocaleString(),
      subtext: "Customer issue resolved",
      icon: CheckCircle2,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      title: "Pending Tickets",
      value: stats.pendingTickets.toLocaleString(),
      subtext: "Active & in-progress",
      icon: AlertCircle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="border-border/60 bg-card hover:border-border transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.subtext}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

