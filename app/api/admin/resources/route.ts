import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  return url && secret ? { url, secret } : null;
}
export async function GET() {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Moderation service is not configured." }, { status: 503 });
  try {
    const data = await new ConvexHttpClient(cfg.url).query(api.admin.listResourceSubmissions, { adminSecret: cfg.secret });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Resource moderation list failed:", error);
    return NextResponse.json({ error: "Could not load the moderation queue." }, { status: 502 });
  }
}
export async function PATCH(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getSpiderProfile();
  const cfg = config();
  if (!user || !cfg) return NextResponse.json({ error: "Moderation service is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.resourceId !== "string" || !["active", "rejected"].includes(String(body.status))
    || (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000))) {
    return NextResponse.json({ error: "Invalid moderation decision." }, { status: 400 });
  }
  try {
    const result = await new ConvexHttpClient(cfg.url).mutation(api.admin.reviewResourceSubmission, {
      adminSecret: cfg.secret, resourceId: body.resourceId as any,
      status: body.status as "active" | "rejected",
      reason: typeof body.reason === "string" ? body.reason : undefined,
      actorDiscordId: user.id, actorName: user.displayName || user.username,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the decision.";
    console.error("Resource moderation decision failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
