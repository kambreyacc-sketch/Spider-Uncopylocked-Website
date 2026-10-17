import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getBillingDb } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in with Discord to search Spider members." }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search")?.trim() || "";
  if (search.length < 2) return NextResponse.json({ members: [] }, { headers: { "Cache-Control": "no-store" } });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Member search is not configured yet." }, { status: 503 });
  try {
    const members = await db.client.query(api.messages.searchMembers, { adminSecret: db.secret, discordId: profile.id, search: search.slice(0, 80) });
    return NextResponse.json({ members }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Spider member search failed:", error);
    return NextResponse.json({ error: "Member search is temporarily unavailable." }, { status: 502 });
  }
}
