"use client";
// app/(dashboard)/analytics/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { RefreshCw } from "lucide-react";

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#f43f5e", "#8b5cf6"];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    callStatusData: { name: string; value: number }[];
    ticketStatusData: { name: string; value: number }[];
    callTypeData: { name: string; value: number }[];
  }>({
    callStatusData: [],
    ticketStatusData: [],
    callTypeData: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [callsRes, ticketsRes] = await Promise.all([
        fetch("/api/calls"),
        fetch("/api/tickets"),
      ]);

      const calls = await callsRes.json();
      const tickets = await ticketsRes.json();

      // Aggregate call status
      const callStatusMap: Record<string, number> = {};
      const callTypeMap: Record<string, number> = {};
      if (Array.isArray(calls)) {
        calls.forEach((c: any) => {
          callStatusMap[c.status] = (callStatusMap[c.status] || 0) + 1;
          callTypeMap[c.callType] = (callTypeMap[c.callType] || 0) + 1;
        });
      }

      // Aggregate ticket status
      const ticketStatusMap: Record<string, number> = {};
      if (Array.isArray(tickets)) {
        tickets.forEach((t: any) => {
          ticketStatusMap[t.status] = (ticketStatusMap[t.status] || 0) + 1;
        });
      }

      setData({
        callStatusData: Object.entries(callStatusMap).map(([name, value]) => ({ name, value })),
        ticketStatusData: Object.entries(ticketStatusMap).map(([name, value]) => ({ name, value })),
        callTypeData: Object.entries(callTypeMap).map(([name, value]) => ({ name, value })),
      });
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="flex flex-col">
      <Header
        title="Analytics & Reports"
        description="Performance distributions, channel volume, and resolution trends"
      />

      <div className="space-y-6 p-6">
        {loading || !mounted ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Call Status Distribution */}
            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Call Status Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Proportion of completed, missed, or in-progress calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.callStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.callStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          borderColor: "#262626",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Support Ticket Status Distribution */}
            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Support Ticket Status Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Cases by resolution workflow stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.ticketStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.5} />
                      <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                      <YAxis stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          borderColor: "#262626",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" name="Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Call Type Breakdown */}
            <Card className="border-border/60 bg-card md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Channel Volume Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Inbound customer calls vs Outbound follow-ups and Browser Demo sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.callTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.5} />
                      <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                      <YAxis stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          borderColor: "#262626",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" name="Total Calls" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
