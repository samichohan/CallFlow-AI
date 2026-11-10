// app/api/vapi/assistant/route.ts
// Secure backend integration with Vapi REST API using VAPI_PRIVATE_API_KEY.
// Never exposes private credentials to frontend code.

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const privateKey = process.env.VAPI_PRIVATE_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  if (!privateKey) {
    return NextResponse.json(
      { error: "VAPI_PRIVATE_API_KEY is not configured in backend environment." },
      { status: 400 }
    );
  }

  if (!assistantId) {
    return NextResponse.json(
      { error: "VAPI_ASSISTANT_ID is not configured." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          error: `Vapi API returned ${res.status}: ${res.statusText}`,
          details: errText,
          assistantId,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Sanitize and return safe assistant details
    return NextResponse.json({
      success: true,
      assistant: {
        id: data.id,
        name: data.name,
        model: {
          provider: data.model?.provider,
          model: data.model?.model,
          toolsCount: data.model?.tools?.length || 0,
        },
        voice: {
          provider: data.voice?.provider,
          voiceId: data.voice?.voiceId,
        },
        transcriber: {
          provider: data.transcriber?.provider,
          model: data.transcriber?.model,
        },
        firstMessage: data.firstMessage,
        serverUrl: data.serverUrl,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Vapi backend API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reach Vapi API" },
      { status: 500 }
    );
  }
}

