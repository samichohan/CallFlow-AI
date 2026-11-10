// app/api/tools/execute/route.ts
// Direct API endpoint for executing CRM tools and automated testing.

import { NextRequest, NextResponse } from "next/server";
import { executeTool } from "@/lib/tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool, arguments: args } = body;

    if (!tool) {
      return NextResponse.json({ error: "Missing 'tool' name in request body" }, { status: 400 });
    }

    const result = await executeTool(tool, args || {});
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute tool" },
      { status: 500 }
    );
  }
}

