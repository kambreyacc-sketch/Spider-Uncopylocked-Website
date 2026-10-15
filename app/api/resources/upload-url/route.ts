import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";
import { checkAccountRestriction } from "../../../../lib/account-restrictions";

export const runtime = "nodejs";
export async function POST() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before uploading." }, { status: 401 });
  const restriction = await checkAccountRestriction(user.id, "upload");
  if (restriction.status === "unavailable") return NextResponse.json({ error: "Could not verify your account standing. Upload authorization is unavailable." }, { status: 503 });
  if (restriction.status === "blocked") return NextResponse.json({ error: "Uploads are blocked by an active " + restriction.kind.toLowerCase() + " action: " + restriction.reason }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Upload storage is not configured." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, { adminSecret: db.secret, applicantDiscordId: user.id, type: "Resource / leaker upload" });
    if (!approved) return NextResponse.json({ error: "Resource upload access has not been approved for your account. Apply for Resource / leaker upload access first.", applyUrl: "/apply" }, { status: 403 });
    const url = await db.client.mutation(api.resources.generateUploadUrl, { adminSecret: db.secret });
    return NextResponse.json({ uploadUrl: url }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Resource upload URL failed:", error);
    return NextResponse.json({ error: "Could not authorize a resource upload. Confirm the application and resource functions are deployed." }, { status: 503 });
  }
}
