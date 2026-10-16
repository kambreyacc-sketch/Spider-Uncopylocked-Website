import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { isSpiderAdmin } from "../../../../lib/session";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = (process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);
  if (!url || !secret) return NextResponse.json({ error: "Admin database connection is not configured." }, { status: 503 });
  try {
    const data = await new ConvexHttpClient(url).query(api.admin.getPlatformOverview, { adminSecret: secret });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin platform overview failed:", error);
    return NextResponse.json({ error: "Could not load live platform metrics. Verify that the Convex schema and functions have been deployed." }, { status: 502 });
  }
}
