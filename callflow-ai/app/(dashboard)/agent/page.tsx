"use client";
// app/(dashboard)/agent/page.tsx
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone, PhoneOff, Mic, MicOff, Bot, Sparkles, AlertCircle, Clock, Volume2,
  ShieldCheck, Database, CheckCircle2, Wrench, RefreshCw, Radio
} from "lucide-react";
import { useVapi } from "@/hooks/useVapi";
import { formatCallDuration } from "@/lib/utils";
import { Customer } from "@/types";

export default function AgentPage() {
  const {
    callStatus,
    isMuted,
    isSpeaking,
    volumeLevel,
    duration,
    messages,
    assistantId,
    errorMessage,
    startCall,
    endCall,
    toggleMute,
  } = useVapi();

  // Assistant cloud details from secure backend route
  const [assistantData, setAssistantData] = useState<any>(null);
  const [checkingAssistant, setCheckingAssistant] = useState(false);
  const [assistantCheckError, setAssistantCheckError] = useState<string | null>(null);

  // CRM Customers for caller simulator
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("custom");
  const [customerPhone, setCustomerPhone] = useState("+12025550101");
  const [customerName, setCustomerName] = useState("Alice Johnson");

  // Call completion saving state
  const [savedCallId, setSavedCallId] = useState<string | null>(null);
  const [isSavingCall, setIsSavingCall] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing customers for simulator dropdown
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (e) {
        console.warn("Failed to fetch customers list:", e);
      }
    }
    fetchCustomers();
  }, []);

  // Fetch verified assistant details from backend Vapi API
  const verifyAssistant = async () => {
    setCheckingAssistant(true);
    setAssistantCheckError(null);
    try {
      const res = await fetch("/api/vapi/assistant");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Assistant verification failed");
      }
      setAssistantData(data.assistant);
    } catch (err: any) {
      setAssistantCheckError(err.message || "Failed to reach Vapi API");
    } finally {
      setCheckingAssistant(false);
    }
  };

  useEffect(() => {
    verifyAssistant();
  }, []);

  // When customer is selected from dropdown, update caller details
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === "custom") {
      setCustomerName("");
      setCustomerPhone("");
      return;
    }
    const match = customers.find((c) => c.id === id);
    if (match) {
      setCustomerName(match.fullName);
      setCustomerPhone(match.phone);
    }
  };

  // Handle Call Completion: Auto-save call when status transitions to "ended" with messages
  useEffect(() => {
    if (callStatus === "ended" && messages.length > 0 && !savedCallId && !isSavingCall) {
      saveCompletedCall();
    }
  }, [callStatus, messages, savedCallId, isSavingCall]);

  const saveCompletedCall = async () => {
    setIsSavingCall(true);
    try {
      const fullTranscript = messages
        .filter((m) => m.role !== "tool")
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const summary = `Voice conversation between ${customerName || "Customer"} and AI Support Agent (${duration}s).`;

      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId !== "custom" ? selectedCustomerId : undefined,
          phoneNumber: customerPhone || null,
          callType: "demo",
          status: "ended",
          duration,
          transcript: fullTranscript,
          summary,
          outcome: "resolved",
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setSavedCallId(saved.id);
      }
    } catch (e) {
      console.error("Failed to auto-save call to database:", e);
    } finally {
      setIsSavingCall(false);
    }
  };

  const handleStartCall = () => {
    setSavedCallId(null);
    startCall({
      customerName: customerName || "Guest",
      customerPhone: customerPhone || "Unknown",
    });
  };

  return (
    <div className="flex flex-col">
      <Header
        title="AI Calling Agent — Vapi Voice Console"
        description="Browser-based voice engine powered by Vapi AI & Groq LLM with live CRM Tool Execution"
      />

      <div className="space-y-6 p-6">
        {/* Top Section: Assistant Config & Live Voice Console */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Voice Calling Panel */}
          <Card className="border-border/60 bg-card lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {assistantData?.name || "CallFlow Customer Support Agent"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      ID: <code className="font-mono">{assistantId ? `${assistantId.slice(0, 14)}...` : "Loading..."}</code>
                      {assistantData?.model?.provider && ` • Provider: ${assistantData.model.provider}`}
                    </CardDescription>
                  </div>
                </div>

                {/* Call Status Badge */}
                <Badge
                  variant="outline"
                  className={
                    callStatus === "connected"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs py-1 px-3"
                      : callStatus === "connecting"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs py-1 px-3 animate-pulse"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs py-1 px-3"
                  }
                >
                  {callStatus === "connected" && (
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  )}
                  {callStatus === "connecting" && (
                    <Radio className="mr-1.5 h-3 w-3 inline-block animate-spin" />
                  )}
                  STATUS: {callStatus.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Architecture & Guardrails Notice */}
              <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1.5 text-muted-foreground border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Guardrails Enabled:
                  </span>
                  <span>Strict zero-hallucination policy (Refuses to guess orders/records)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Database className="h-3.5 w-3.5 text-primary" /> Active CRM Tools:
                  </span>
                  <span>lookup_customer, lookup_order, create_support_ticket, lookup_ticket</span>
                </div>
              </div>

              {/* Call Controls Center */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/50 p-8 text-center min-h-[220px]">
                {callStatus === "connected" ? (
                  <div className="space-y-4 w-full max-w-sm">
                    {/* Live Duration Timer */}
                    <div className="flex items-center justify-center gap-2 text-3xl font-mono font-bold text-foreground">
                      <Clock className="h-6 w-6 text-primary animate-pulse" />
                      {formatCallDuration(duration)}
                    </div>

                    {/* Audio Wave / Speaking Indicator */}
                    <div className="flex items-center justify-center gap-1.5 h-6">
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                        <Volume2 className="h-4 w-4 animate-bounce" />
                        {isSpeaking ? "Voice stream active (Agent/Caller speaking)" : "Connected — listening..."}
                      </span>
                    </div>

                    {/* Controls: Mute & End Call */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <Button
                        variant={isMuted ? "destructive" : "secondary"}
                        size="icon"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        className="h-11 w-11 rounded-full"
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="destructive"
                        size="lg"
                        className="gap-2 px-8 rounded-full font-semibold shadow-lg shadow-destructive/20"
                        onClick={endCall}
                      >
                        <PhoneOff className="h-5 w-5" />
                        End Call
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Start Browser-Based Voice Call
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Connects directly to your configured Vapi Assistant using WebRTC microphone audio.
                      </p>
                    </div>

                    <Button
                      onClick={handleStartCall}
                      disabled={callStatus === "connecting" || !assistantId}
                      size="lg"
                      className="gap-2 w-full rounded-full font-semibold shadow-lg shadow-primary/25"
                    >
                      <Sparkles className="h-4 w-4" />
                      {callStatus === "connecting" ? "Connecting to Vapi Voice Stream..." : "Start Demo Call"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Error State Banner */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Vapi Voice Connection Notice</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Call Saved Banner */}
              {savedCallId && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Call completed and securely saved to database (Call ID: <code className="font-mono">{savedCallId}</code>).
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Customer Simulator & Assistant Health */}
          <div className="space-y-6">
            {/* Caller Identity Simulator */}
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Caller Identity Simulator</CardTitle>
                <CardDescription className="text-xs">
                  Set caller info passed to the assistant during demo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Select CRM Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select existing customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">-- Custom Caller --</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName} ({c.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. Alice Johnson"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 text-xs font-mono"
                    placeholder="+12025550101"
                  />
                </div>

                <div className="rounded bg-secondary/40 p-2.5 text-[11px] text-muted-foreground space-y-1 border border-border/30">
                  <p className="font-medium text-foreground">💡 Sample test prompts:</p>
                  <p>• <em>"Can you look up my account?"</em> (matches phone)</p>
                  <p>• <em>"Where is my order #1234?"</em> (real order check)</p>
                  <p>• <em>"I want to file a support ticket for return."</em></p>
                </div>
              </CardContent>
            </Card>

            {/* Assistant Verification & Backend Status */}
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Backend Integration</CardTitle>
                  <CardDescription className="text-xs">Secure Vapi REST API verification</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={verifyAssistant}
                  disabled={checkingAssistant}
                  title="Refresh Assistant Status"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checkingAssistant ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Assistant ID:</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {assistantId ? `${assistantId.slice(0, 10)}...` : "Missing"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Vapi API Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      assistantData
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }
                  >
                    {assistantData ? "Verified & Live" : checkingAssistant ? "Verifying..." : "Unreachable"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Private Key:</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Kept Secure on Server
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Webhook Endpoint:</span>
                  <span className="font-mono text-[11px] text-primary">/api/webhooks/vapi</span>
                </div>

                {assistantCheckError && (
                  <p className="text-[11px] text-destructive pt-1">
                    Notice: {assistantCheckError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Conversation Transcript */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Live Conversation Transcript</CardTitle>
              <CardDescription className="text-xs">
                Real-time speech-to-text transcript as customer and agent speak
              </CardDescription>
            </div>
            {messages.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {messages.length} messages
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[320px] overflow-y-auto space-y-3 rounded-lg border border-border/40 bg-secondary/20 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {callStatus === "connected"
                      ? "Listening... Speak into your microphone."
                      : "No active conversation"}
                  </p>
                  <p className="mt-1">
                    {callStatus === "connected"
                      ? "Live transcribed sentences will appear here."
                      : "Click 'Start Demo Call' above to begin a live voice conversation."}
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  if (m.role === "tool") {
                    return (
                      <div key={m.id} className="flex justify-center my-1.5">
                        <Badge
                          variant="outline"
                          className="gap-1.5 border-primary/40 bg-primary/10 text-primary text-[11px] py-1 px-3"
                        >
                          <Wrench className="h-3 w-3" />
                          <span>{m.content}</span>
                          <span className="text-muted-foreground">• {m.time}</span>
                        </Badge>
                      </div>
                    );
                  }

                  const isAssistant = m.role === "assistant";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {isAssistant ? "AI Agent (Alex)" : customerName || "Customer"}
                        </span>
                        <span>• {m.time}</span>
                        {m.isPartial && (
                          <span className="text-[10px] text-primary italic">(speaking...)</span>
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                          isAssistant
                            ? "bg-secondary text-foreground border border-border/50"
                            : "bg-primary text-primary-foreground"
                        } ${m.isPartial ? "opacity-90 border-dashed" : ""}`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
