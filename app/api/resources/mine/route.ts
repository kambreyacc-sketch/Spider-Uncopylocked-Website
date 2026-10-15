import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view your uploads." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Resource storage is not configured." }, { status: 503 });
  try {
    const resources = await db.client.query(api.resources.mine, { adminSecret: db.secret, creatorDiscordId: user.id });
    return NextResponse.json({ resources }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Private resource submissions lookup failed:", error);
    return NextResponse.json({ error: "Your submissions could not be loaded. Confirm the current Convex functions are deployed." }, { status: 503 });
  }
}
