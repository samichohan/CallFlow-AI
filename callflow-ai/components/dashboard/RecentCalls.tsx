"use client";
// components/dashboard/RecentCalls.tsx
import Link from "next/link";
import { ArrowUpRight, PhoneIncoming, PhoneOutgoing, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCallDuration, statusColor } from "@/lib/utils";
import { Call } from "@/types";

export default function RecentCalls({ calls }: { calls: Call[] }) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
          <CardDescription className="text-xs">Latest customer interactions handled</CardDescription>
        </div>
        <Link
          href="/calls"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No calls recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    {call.callType === "outbound" ? (
                      <PhoneOutgoing className="h-3.5 w-3.5 text-blue-400" />
                    ) : (
                      <PhoneIncoming className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {call.customer?.fullName || call.phoneNumber || "Unknown Caller"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {call.customer?.company ? `${call.customer.company} • ` : ""}
                      {formatCallDuration(call.duration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColor(call.status)}>
                    {call.status}
                  </Badge>
                  {call.summary && (
                    <span title={call.summary}>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 opacity-80" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

