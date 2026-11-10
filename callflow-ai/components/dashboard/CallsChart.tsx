"use client";
// components/dashboard/CallsChart.tsx
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CallsChartData } from "@/types";

export default function CallsChart({ data }: { data: CallsChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Calls Activity & Status</CardTitle>
        <CardDescription className="text-xs">
          Daily volume of answered vs missed calls over the past 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          {!mounted ? (
            <div className="h-full w-full rounded-lg bg-secondary/20 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="answeredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.5} />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#262626",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="answered"
                  name="Answered Calls"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#answeredGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="missed"
                  name="Missed Calls"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#missedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
