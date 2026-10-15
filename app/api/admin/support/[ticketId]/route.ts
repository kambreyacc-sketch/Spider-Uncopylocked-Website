import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../../lib/session";
export const dynamic = "force-dynamic";
function config() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  return url && secret ? { url, secret } : null;
}
type Context = { params: Promise<{ ticketId: string }> };
export async function GET(_request: Request, context: Context) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  const { ticketId } = await context.params;
  try {
    const record = await new ConvexHttpClient(cfg.url).query(api.support.getTicket, { adminSecret: cfg.secret, ticketId: ticketId as any });
    if (!record) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json(record, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin ticket detail failed:", error);
    return NextResponse.json({ error: "Could not load ticket details." }, { status: 502 });
  }
}
export async function POST(request: Request, context: Context) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getSpiderProfile();
  const cfg = config();
  if (!user || !cfg) return NextResponse.json({ error: "Support service is not configured." }, { status: 503 });
  const { ticketId } = await context.params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const visibility = body.visibility === "internal" ? "internal" : body.visibility === "public" ? "public" : null;
  if (!visibility || typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 5000) {
    return NextResponse.json({ error: "Choose a message type and enter 1–5,000 characters." }, { status: 400 });
  }
  try {
    const result = await new ConvexHttpClient(cfg.url).mutation(api.support.addMessage, {
      adminSecret: cfg.secret, ticketId: ticketId as any, authorDiscordId: user.id,
      authorName: user.displayName || user.username, body: body.body.trim(), visibility,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send message." }, { status: 400 });
  }
}
