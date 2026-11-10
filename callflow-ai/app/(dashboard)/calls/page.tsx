"use client";
// app/(dashboard)/calls/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PhoneCall, Search, PhoneIncoming, PhoneOutgoing, Sparkles, Clock, FileText, Play, RefreshCw, Eye
} from "lucide-react";
import { formatCallDuration, statusColor } from "@/lib/utils";
import { Call } from "@/types";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.append("callType", typeFilter);

      const res = await fetch(`/api/calls?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (e) {
      console.error("Failed to fetch calls:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [search, statusFilter, typeFilter]);

  return (
    <div className="flex flex-col">
      <Header
        title="Call History & Recordings"
        description="Review all AI and agent customer voice calls with transcripts and summaries"
      />

      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3 max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search phone, caller, summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="demo">Demo Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCalls}
            disabled={loading}
            className="gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Calls Table */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
                <PhoneCall className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No call records found</p>
                <p>Calls initiated through Vapi or the AI Calling Agent will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Caller</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Outcome</th>
                      <th className="px-4 py-3">AI Summary</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {calls.map((call) => (
                      <tr key={call.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {call.callType === "outbound" ? (
                              <PhoneOutgoing className="h-3.5 w-3.5 text-blue-400" />
                            ) : (
                              <PhoneIncoming className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            <span className="capitalize">{call.callType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {call.customer?.fullName || "Guest Caller"}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {call.phoneNumber || "No phone"}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono">{formatCallDuration(call.duration)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusColor(call.status)}>
                            {call.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-border text-foreground">
                            {call.outcome || "unspecified"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="truncate text-muted-foreground">
                            {call.summary || "No summary recorded"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(call.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedCall(call)}
                            title="Inspect Call"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Details Modal */}
      <Dialog open={Boolean(selectedCall)} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" />
              <span>Call Details & AI Transcript</span>
              {selectedCall && (
                <Badge variant="outline" className={statusColor(selectedCall.status)}>
                  {selectedCall.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Call ID: <code className="font-mono">{selectedCall?.id}</code>
              {selectedCall?.vapiCallId && ` • Vapi ID: ${selectedCall.vapiCallId}`}
            </DialogDescription>
          </DialogHeader>

          {selectedCall && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Caller</p>
                  <p className="font-semibold text-foreground">{selectedCall.customer?.fullName || "Guest"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-mono text-foreground">{selectedCall.phoneNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold text-foreground">{formatCallDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outcome</p>
                  <p className="font-semibold text-foreground capitalize">{selectedCall.outcome || "Resolved"}</p>
                </div>
              </div>

              {/* AI Summary */}
              {selectedCall.summary && (
                <div className="rounded-lg border border-border/50 bg-primary/5 p-3.5">
                  <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Call Summary</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{selectedCall.summary}</p>
                </div>
              )}

              {/* Audio recording player if available */}
              {selectedCall.recordingUrl && (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 text-primary" /> Audio Recording
                  </p>
                  <audio controls className="w-full h-8" src={selectedCall.recordingUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Transcript */}
              <div>
                <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Full Conversation Transcript
                </p>
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3.5 max-h-60 overflow-y-auto font-mono text-[11px] whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {selectedCall.transcript || "No transcript recorded for this call."}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

