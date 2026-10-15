import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const runtime = "nodejs";
export async function POST() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before uploading a listing thumbnail." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Marketplace storage is not configured." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, { adminSecret: db.secret, applicantDiscordId: user.id, type: "Marketplace posting access" });
    if (!approved) return NextResponse.json({ error: "Marketplace posting access has not been approved. Submit an application first.", applyUrl: "/apply" }, { status: 403 });
    const url = await db.client.mutation(api.listings.generateUploadUrl, { adminSecret: db.secret });
    return NextResponse.json({ uploadUrl: url }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Listing upload URL failed:", error);
    return NextResponse.json({ error: "Could not authorize thumbnail upload. Confirm marketplace and application functions are deployed." }, { status: 503 });
  }
}
