import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../../lib/session";
export const dynamic = "force-dynamic";
function config() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = (process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);
  return url && secret ? { url, secret } : null;
}
type Context = { params: Promise<{ ticketId: string }> };
export async function GET(_request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view this ticket." }, { status: 401 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  const { ticketId } = await context.params;
  try {
    const record = await new ConvexHttpClient(cfg.url).query(api.support.getTicket, { adminSecret: cfg.secret, ticketId: ticketId as any });
    if (!record || record.ticket.applicantDiscordId !== user.id) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json({
      ticket: record.ticket,
      messages: record.messages.filter((m: { visibility: string }) => m.visibility === "public"),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Read support ticket failed:", error);
    return NextResponse.json({ error: "Unable to load this ticket." }, { status: 502 });
  }
}
export async function POST(request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to reply." }, { status: 401 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  const { ticketId } = await context.params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 5000) return NextResponse.json({ error: "Reply must be 1–5,000 characters." }, { status: 400 });
  try {
    const client = new ConvexHttpClient(cfg.url);
    const record = await client.query(api.support.getTicket, { adminSecret: cfg.secret, ticketId: ticketId as any });
    if (!record || record.ticket.applicantDiscordId !== user.id) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    await client.mutation(api.support.addMessage, {
      adminSecret: cfg.secret, ticketId: ticketId as any, authorDiscordId: user.id,
      authorName: user.displayName || user.username, body: body.body.trim(), attachments: Array.isArray(body.attachments) ? body.attachments.filter((x): x is string => typeof x === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/.test(x) && x.length <= 300000).slice(0, 3) : undefined, visibility: "public",
    });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send reply.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
