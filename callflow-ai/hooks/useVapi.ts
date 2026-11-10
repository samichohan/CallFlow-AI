"use client";
// hooks/useVapi.ts
import { useEffect, useRef, useState, useCallback } from "react";

export type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error";

export interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  time: string;
  toolName?: string;
  toolResult?: any;
  isPartial?: boolean;
}

export function useVapi() {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string>(
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ""
  );
  const [assistantId, setAssistantId] = useState<string>(
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || ""
  );

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch dynamic config on mount from secure backend route
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/vapi/config");
        if (res.ok) {
          const data = await res.json();
          if (data.assistantId) {
            setAssistantId(data.assistantId);
          }
          if (data.fullPublicKey) {
            setPublicKey(data.fullPublicKey);
          }
        }
      } catch (e) {
        // Fallback to env
      }
    }
    loadConfig();
  }, []);

  // 2. Initialize Vapi client safely on client-side (prevents SSR WebRTC crash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;

    async function initVapi() {
      const activeKey = publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (!activeKey) {
        return;
      }

      try {
        const VapiModule = await import("@vapi-ai/web");
        const VapiConstructor = (VapiModule as any).default || VapiModule;

        if (!isMounted) return;

        const vapi = new VapiConstructor(activeKey);
        vapiRef.current = vapi;

        // Event: Call started
        vapi.on("call-start", () => {
          setCallStatus("connected");
          setErrorMessage(null);
          setDuration(0);

          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setDuration((prev) => prev + 1);
          }, 1000);
        });

        // Event: Call ended
        vapi.on("call-end", () => {
          setCallStatus("ended");
          setIsSpeaking(false);
          setVolumeLevel(0);
          if (timerRef.current) clearInterval(timerRef.current);
        });

        // Event: Speech Start / Stop
        vapi.on("speech-start", () => {
          setIsSpeaking(true);
        });

        vapi.on("speech-end", () => {
          setIsSpeaking(false);
        });

        // Event: Volume level (0 to 1)
        vapi.on("volume-level", (vol: number) => {
          setVolumeLevel(vol);
        });

        // Event: Messages (transcripts, function calls, system events)
        vapi.on("message", (msg: any) => {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          // Transcript handling
          if (msg.type === "transcript") {
            const role = msg.role === "assistant" ? "assistant" : "user";
            const content = msg.transcript?.trim();

            if (!content) return;

            if (msg.transcriptType === "partial") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === role && last.isPartial) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content, time: timestamp },
                  ];
                }
                return [
                  ...prev,
                  {
                    id: `partial-${Date.now()}`,
                    role,
                    content,
                    time: timestamp,
                    isPartial: true,
                  },
                ];
              });
            } else if (msg.transcriptType === "final") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === role && last.isPartial) {
                  return [
                    ...prev.slice(0, -1),
                    {
                      id: `msg-${Date.now()}`,
                      role,
                      content,
                      time: timestamp,
                      isPartial: false,
                    },
                  ];
                }
                return [
                  ...prev,
                  {
                    id: `msg-${Date.now()}`,
                    role,
                    content,
                    time: timestamp,
                    isPartial: false,
                  },
                ];
              });
            }
          }

          // Tool execution handling
          if (msg.type === "tool-calls") {
            const toolCalls = msg.toolCalls || [];
            for (const tc of toolCalls) {
              const toolName = tc.function?.name || "crm_tool";
              let args: any = {};
              try {
                args = typeof tc.function?.arguments === "string"
                  ? JSON.parse(tc.function.arguments)
                  : tc.function?.arguments || {};
              } catch {}

              // Display immediate visual badge that tool is being invoked
              setMessages((prev) => [
                ...prev,
                {
                  id: `tool-${Date.now()}-${tc.id}`,
                  role: "tool",
                  content: `Calling tool '${toolName}' with arguments: ${JSON.stringify(args)}`,
                  toolName,
                  time: timestamp,
                  isPartial: false,
                },
              ]);

              // Execute locally on CallFlow backend to guarantee database insertion!
              fetch("/api/tools/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool: toolName, arguments: args }),
              })
                .then((res) => res.json())
                .then((resultData) => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `tool-res-${Date.now()}-${tc.id}`,
                      role: "tool",
                      content: `Result (${toolName}): ${resultData.message || JSON.stringify(resultData)}`,
                      toolName,
                      toolResult: resultData,
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                      isPartial: false,
                    },
                  ]);

                  // Return tool call result back to Vapi AI engine
                  try {
                    if (vapiRef.current?.send) {
                      vapiRef.current.send({
                        type: "add-message",
                        message: {
                          role: "tool",
                          tool_call_id: tc.id,
                          content: typeof resultData === "string" ? resultData : JSON.stringify(resultData),
                        },
                        triggerResponseEnabled: true,
                      });
                    }
                  } catch (e) {
                    console.warn("Failed to send tool result to Vapi Web SDK:", e);
                  }
                })
                .catch((err) => {
                  console.error("Local tool execution failed:", err);
                });
            }
          }

          // Legacy function-call handling
          if (msg.type === "function-call") {
            const fc = msg.functionCall || {};
            const toolName = fc.name || "crm_tool";
            let args: any = fc.parameters || {};
            if (typeof args === "string") {
              try { args = JSON.parse(args); } catch {}
            }

            fetch("/api/tools/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool: toolName, arguments: args }),
            })
              .then((res) => res.json())
              .then((resultData) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `func-res-${Date.now()}`,
                    role: "tool",
                    content: `Result (${toolName}): ${resultData.message || JSON.stringify(resultData)}`,
                    toolName,
                    toolResult: resultData,
                    time: timestamp,
                    isPartial: false,
                  },
                ]);

                try {
                  if (vapiRef.current?.send) {
                    vapiRef.current.send({
                      type: "add-message",
                      message: {
                        role: "function",
                        name: toolName,
                        content: typeof resultData === "string" ? resultData : JSON.stringify(resultData),
                      },
                      triggerResponseEnabled: true,
                    });
                  }
                } catch (e) {
                  console.warn("Failed to send function result to Vapi Web SDK:", e);
                }
              });
          }
        });

        // Event: Error
        vapi.on("error", (error: any) => {
          console.error("Vapi Web SDK error:", error);
          setCallStatus("error");
          setErrorMessage(error?.message || "Voice connection encountered an error.");
          if (timerRef.current) clearInterval(timerRef.current);
        });
      } catch (e: any) {
        console.warn("Failed to initialize Vapi Web SDK:", e);
        setErrorMessage(e.message || "Failed to initialize audio stream.");
      }
    }

    initVapi();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {}
      }
    };
  }, [publicKey]);

  // 3. Start Call method
  const startCall = useCallback(
    async (variableValues?: Record<string, any>) => {
      const activeKey = publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      const targetAssistantId =
        assistantId ||
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
        process.env.VAPI_ASSISTANT_ID;

      if (!activeKey) {
        setCallStatus("error");
        setErrorMessage(
          "NEXT_PUBLIC_VAPI_PUBLIC_KEY is not configured in .env file."
        );
        return;
      }

      if (!targetAssistantId) {
        setCallStatus("error");
        setErrorMessage(
          "VAPI_ASSISTANT_ID is not configured. Please add it to your .env file."
        );
        return;
      }

      setCallStatus("connecting");
      setErrorMessage(null);
      setMessages([]);
      setDuration(0);

      try {
        if (!vapiRef.current) {
          const VapiModule = await import("@vapi-ai/web");
          const VapiConstructor = (VapiModule as any).default || VapiModule;
          vapiRef.current = new VapiConstructor(publicKey);
        }

        const overrides: any = {};
        if (variableValues && Object.keys(variableValues).length > 0) {
          overrides.variableValues = variableValues;
        }

        const call = await vapiRef.current.start(targetAssistantId, overrides);

        if (call?.id) {
          setActiveCallId(call.id);
        }
      } catch (err: any) {
        console.error("Failed to start Vapi call:", err);
        setCallStatus("error");
        setErrorMessage(err.message || "Failed to start call with Vapi Assistant.");
      }
    },
    [assistantId]
  );

  // 4. End Call method
  const endCall = useCallback(() => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (e) {
        console.error("Stop error:", e);
      }
    }
    setCallStatus("ended");
    setIsSpeaking(false);
    setVolumeLevel(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // 5. Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const nextMuted = !isMuted;
      try {
        vapiRef.current.setMuted(nextMuted);
        setIsMuted(nextMuted);
      } catch (e) {
        console.error("Mute toggle failed:", e);
      }
    }
  }, [isMuted]);

  return {
    callStatus,
    isMuted,
    isSpeaking,
    volumeLevel,
    duration,
    messages,
    activeCallId,
    assistantId,
    errorMessage,
    startCall,
    endCall,
    toggleMute,
  };
}
