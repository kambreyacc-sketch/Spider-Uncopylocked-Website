import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { isSpiderAdmin, getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const statuses = ["active", "rejected", "pending"] as const;
export async function GET() {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Moderation database is not configured." }, { status: 503 });
  try {
    const result = await db.client.query(api.admin.listPendingContent, { adminSecret: db.secret });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Content moderation queue failed:", error);
    return NextResponse.json({ error: "The moderation queue is not ready. Deploy the current Convex schema and admin functions." }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actor = await getSpiderProfile(), db = getServiceConvex();
  if (!actor || !db) return NextResponse.json({ error: "Admin session or moderation storage unavailable." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!["resource", "listing"].includes(String(body.contentType))) return NextResponse.json({ error: "Choose a valid content type." }, { status: 400 });
  if (typeof body.contentId !== "string" || !body.contentId) return NextResponse.json({ error: "Missing content identifier." }, { status: 400 });
  if (typeof body.status !== "string" || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "Invalid moderation status." }, { status: 400 });
  if (body.status === "active" && !body.confirmed) return NextResponse.json({ error: "Explicit confirmation is required before publishing." }, { status: 400 });
  if (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000)) return NextResponse.json({ error: "Reason must be 1,000 characters or fewer." }, { status: 400 });
  try {
    const common = { adminSecret: db.secret, status: body.status as typeof statuses[number], reviewerDiscordId: actor.id, reviewerName: actor.displayName || actor.username, ...(typeof body.reason === "string" ? { reason: body.reason } : {}) };
    const result = body.contentType === "resource"
      ? await db.client.mutation(api.admin.reviewResource, { ...common, resourceId: body.contentId as any })
      : await db.client.mutation(api.admin.reviewListing, { ...common, listingId: body.contentId as any });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moderation action failed.";
    console.error("Content moderation decision failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
