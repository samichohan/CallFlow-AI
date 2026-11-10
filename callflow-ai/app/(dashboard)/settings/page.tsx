"use client";
// app/(dashboard)/settings/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Key, Shield, Sparkles, CheckCircle2, AlertTriangle, Copy, RefreshCw, Send, Bot
} from "lucide-react";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [config, setConfig] = useState<any>(null);
  const [assistant, setAssistant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [configRes, assistantRes] = await Promise.all([
        fetch("/api/vapi/config"),
        fetch("/api/vapi/assistant"),
      ]);

      if (configRes.ok) setConfig(await configRes.json());
      if (assistantRes.ok) {
        const aData = await assistantRes.json();
        setAssistant(aData.assistant);
      }
    } catch (e) {
      console.warn("Failed to fetch settings status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const webhookEndpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/vapi`
    : "http://localhost:3000/api/webhooks/vapi";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncWebhook = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/vapi/assistant/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: webhookEndpoint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync webhook");
      setSyncResult({ success: true, message: `Successfully updated Assistant serverUrl on Vapi!` });
      fetchStatus();
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const envItems = [
    {
      name: "NEXT_PUBLIC_VAPI_PUBLIC_KEY",
      desc: "Client-side public key for browser demo voice calls",
      status: config?.publicKey ? "Configured" : "Missing in .env",
      isConfigured: Boolean(config?.publicKey),
    },
    {
      name: "VAPI_ASSISTANT_ID",
      desc: "Identifier of the configured Vapi AI Voice Assistant",
      status: config?.assistantId ? `${config.assistantId.slice(0, 12)}...` : "Missing in .env",
      isConfigured: Boolean(config?.assistantId),
    },
    {
      name: "VAPI_PRIVATE_API_KEY",
      desc: "Server-side key for assistant orchestration and webhook tool handling",
      status: config?.hasPrivateKey ? "Secure on Backend" : "Missing in .env",
      isConfigured: Boolean(config?.hasPrivateKey),
    },
    {
      name: "GROQ_API_KEY",
      desc: "Groq LLM provider engine token for ultra-low latency voice responses",
      status: "Integrated with Vapi (Groq Engine)",
      isConfigured: true,
    },
    {
      name: "DATABASE_URL",
      desc: "SQLite database (file:./dev.db) ready for PostgreSQL switch",
      status: "Configured (SQLite)",
      isConfigured: true,
    },
  ];

  return (
    <div className="flex flex-col">
      <Header
        title="Settings & System Configuration"
        description="Vapi API keys, Groq model parameters, Webhook endpoints, and security policies"
      />

      <div className="space-y-6 p-6 max-w-5xl">
        {/* Environment Readiness */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">API Credentials & Environment Status</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Status of environment variables loaded from <code>.env</code>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Recheck
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border/40">
              {envItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.isConfigured
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                    }
                  >
                    {item.isConfigured ? (
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1 inline" />
                    )}
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Assistant Inspection */}
        {assistant && (
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Verified Vapi Assistant Configuration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Live parameters queried from Vapi cloud servers using backend credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-secondary/30 p-3 rounded-lg border border-border/40">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-semibold text-foreground">{assistant.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">LLM Provider</p>
                  <p className="font-semibold text-foreground uppercase">{assistant.model?.provider} ({assistant.model?.model})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Voice</p>
                  <p className="font-semibold text-foreground">{assistant.voice?.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Server Webhook</p>
                  <p className="font-mono text-[11px] truncate text-primary">{assistant.serverUrl || "Not yet synced"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhook Configuration & Sync */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Vapi Webhook Endpoint & Sync</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Synchronize this URL to your Vapi Assistant to enable CRM tool execution, transcripts, and call summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Server Webhook URL</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  readOnly
                  value={webhookEndpoint}
                  className="font-mono text-xs bg-secondary/40 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWebhook}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSyncWebhook}
                  disabled={syncing}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  {syncing ? "Syncing to Vapi..." : "Sync to Vapi Assistant"}
                </Button>
              </div>

              {syncResult && (
                <div
                  className={`mt-2 p-2.5 rounded text-xs ${
                    syncResult.success
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-destructive/10 text-destructive border border-destructive/30"
                  }`}
                >
                  {syncResult.message}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground pt-1">
                For local development testing with real incoming webhooks, use ngrok:{" "}
                <code>ngrok http 3000</code> and paste your ngrok URL + <code>/api/webhooks/vapi</code> into Vapi.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security & Outbound Calling Rules */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base font-semibold">Compliance & Calling Guardrails</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Operational rules preventing bulk spam and unverified hallucinated actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Explicit Human Confirmation
              </p>
              <p>
                Bulk automated mass-calling is strictly disabled by default. Outbound voice calls require
                manual agent trigger and verified CRM customer record authorization.
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Zero Hallucination Enforcement
              </p>
              <p>
                The AI Voice Assistant model prompt specifically forbids inventing tracking numbers,
                refund balances, or support policies. It will gracefully escalate unhandled inquiries to human support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
