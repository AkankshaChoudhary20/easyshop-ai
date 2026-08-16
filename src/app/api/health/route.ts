import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { aiEnabled } from "@/lib/ai/client";

// Never statically optimize a health check — it must run its DB probe on
// every request, not once at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await query("SELECT 1");
    return NextResponse.json({ status: "ok", ai_enabled: aiEnabled });
  } catch (err) {
    console.error("[health] db check failed:", err);
    return NextResponse.json({ status: "degraded", ai_enabled: aiEnabled, error: "db_unreachable" }, { status: 503 });
  }
}
