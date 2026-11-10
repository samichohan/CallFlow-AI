// app/api/vapi/config/route.ts
// Returns public Vapi configuration to frontend without exposing private keys.

import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
  const assistantId =
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
    process.env.VAPI_ASSISTANT_ID ||
    "";
  const hasPrivateKey = Boolean(process.env.VAPI_PRIVATE_API_KEY);
  const webhookUrl = process.env.VAPI_WEBHOOK_URL || "/api/webhooks/vapi";

  return NextResponse.json({
    configured: Boolean(publicKey && assistantId),
    publicKey: publicKey ? `${publicKey.slice(0, 8)}...` : null,
    fullPublicKey: publicKey,
    assistantId,
    hasPrivateKey,
    webhookUrl,
  });
}

