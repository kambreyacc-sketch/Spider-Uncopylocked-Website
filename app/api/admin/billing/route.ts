import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { isSpiderAdmin } from "../../../../lib/session";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = (process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);
  if (!url || !secret) return NextResponse.json({ error: "Billing database is not configured." }, { status: 503 });
  try {
    const client = new ConvexHttpClient(url);
    const data = await client.query(api.billing.listForAdmin, { adminSecret: secret });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin billing overview failed:", error);
    return NextResponse.json({ error: "Billing records could not be loaded." }, { status: 502 });
  }
}
