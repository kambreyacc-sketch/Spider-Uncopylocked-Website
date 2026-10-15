import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { isSpiderAdmin } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Live metrics are unavailable because the server-side Convex service is not configured." }, { status: 503 });
  try {
    const result = await db.client.query(api.admin.overviewCounts, { adminSecret: db.secret });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin overview metrics failed:", error);
    return NextResponse.json({ error: "Live metrics could not be loaded. Deploy the current Convex schema and admin functions." }, { status: 503 });
  }
}
