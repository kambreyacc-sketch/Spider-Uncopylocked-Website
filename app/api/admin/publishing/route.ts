import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";

const PUBLISHING_REVIEW_DISCORD_ID = "1404024989208019086";

export const dynamic = "force-dynamic";

function config() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET;
  return url && secret ? { url, secret } : null;
}

export async function GET() {
  const user = await getSpiderProfile();
  if (user?.id !== PUBLISHING_REVIEW_DISCORD_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Publishing moderation is not configured." }, { status: 503 });
  try {
    const data = await new ConvexHttpClient(cfg.url).query(api.admin.listPublishingSubmissions, { adminSecret: cfg.secret });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Publishing moderation queue failed:", error);
    return NextResponse.json({ error: "Could not load the publishing queue. Confirm Convex has deployed the latest schema and functions." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSpiderProfile();
  if (user?.id !== PUBLISHING_REVIEW_DISCORD_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = config();
  if (!user || !cfg) return NextResponse.json({ error: "Publishing moderation is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.entityId !== "string" || !["listing", "job", "studio"].includes(String(body.entityType)) ||
      !["approve", "reject"].includes(String(body.decision)) ||
      (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000))) {
    return NextResponse.json({ error: "Choose a valid submission and moderation decision." }, { status: 400 });
  }
  const client = new ConvexHttpClient(cfg.url);
  const common = { adminSecret: cfg.secret, actorDiscordId: user.id, actorName: user.displayName || user.username, reason: typeof body.reason === "string" ? body.reason : undefined };
  try {
    let result;
    if (body.entityType === "listing") {
      result = await client.mutation(api.admin.reviewListingSubmission, { ...common, listingId: body.entityId as any, status: body.decision === "approve" ? "active" : "rejected" });
    } else if (body.entityType === "job") {
      result = await client.mutation(api.admin.reviewJobSubmission, { ...common, jobId: body.entityId as any, status: body.decision === "approve" ? "open" : "rejected" });
    } else {
      result = await client.mutation(api.admin.reviewStudioSubmission, { ...common, studioId: body.entityId as any, status: body.decision === "approve" ? "active" : "rejected" });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the moderation decision.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
