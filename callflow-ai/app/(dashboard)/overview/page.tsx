"use client";
// app/(dashboard)/overview/page.tsx
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import StatsCards from "@/components/dashboard/StatsCards";
import CallsChart from "@/components/dashboard/CallsChart";
import RecentCalls from "@/components/dashboard/RecentCalls";
import RecentTickets from "@/components/dashboard/RecentTickets";
import { Button } from "@/components/ui/button";
import { RefreshCw, PhoneForwarded } from "lucide-react";
import Link from "next/link";
import { DashboardStats, CallsChartData, Call, SupportTicket } from "@/types";

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<CallsChartData[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const data = await res.json();
      setStats(data.stats);
      setChartData(data.chartData || []);
      setRecentCalls(data.recentCalls || []);
      setRecentTickets(data.recentTickets || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col">
      <Header
        title="Overview Dashboard"
        description="Real-time call volume, agent performance, and CRM analytics"
      />

      <div className="space-y-6 p-6">
        {/* Action bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome to CallFlow AI</h2>
            <p className="text-xs text-muted-foreground">
              Connected AI Voice Agent with Groq Engine & Instant CRM Sync
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" asChild className="gap-1.5 text-xs">
              <Link href="/agent">
                <PhoneForwarded className="h-3.5 w-3.5" />
                Launch Demo Call
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading dashboard metrics...</p>
            </div>
          </div>
        ) : stats ? (
          <>
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CallsChart data={chartData} />
              </div>
              <div>
                <RecentCalls calls={recentCalls} />
              </div>
            </div>

            <div className="grid grid-cols-1">
              <RecentTickets tickets={recentTickets} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

