import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const types = ["Studio registration", "Resource / leaker upload", "Marketplace posting access", "Developer profile", "Content creator", "Discord staff role", "Commission / hiring access"] as const;

export async function GET(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ authenticated: false, approved: false }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
  const type = new URL(request.url).searchParams.get("type");
  if (!type || !types.includes(type as typeof types[number])) return NextResponse.json({ error: "Choose a valid application type." }, { status: 400 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application service is unavailable." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, {
      adminSecret: db.secret, applicantDiscordId: user.id, type: type as typeof types[number],
    });
    return NextResponse.json({ authenticated: true, approved }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Application access check failed:", error);
    return NextResponse.json({ error: "Could not verify application approval. Access remains locked." }, { status: 503 });
  }
}
