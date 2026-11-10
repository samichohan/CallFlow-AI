"use client";
// components/dashboard/RecentTickets.tsx
import Link from "next/link";
import { ArrowUpRight, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/utils";
import { SupportTicket } from "@/types";

export default function RecentTickets({ tickets }: { tickets: SupportTicket[] }) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Support Tickets</CardTitle>
          <CardDescription className="text-xs">Incoming cases created by customer or agent</CardDescription>
        </div>
        <Link
          href="/tickets"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No support tickets active.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Ticket className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="max-w-[200px] sm:max-w-[320px]">
                    <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.customer?.fullName || "Guest Customer"} • {t.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColor(t.priority)}>
                    {t.priority}
                  </Badge>
                  <Badge variant="outline" className={statusColor(t.status)}>
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

