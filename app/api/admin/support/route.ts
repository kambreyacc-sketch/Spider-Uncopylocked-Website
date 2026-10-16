import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config() { const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL; const secret = (process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET); return url && secret ? { url, secret } : null; }
export async function GET(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = config(); if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  const url = new URL(request.url); const filter = url.searchParams.get("status");
  const allowed = ["open", "in_review", "waiting_on_user", "escalated", "resolved", "closed"];
  if (filter && !allowed.includes(filter)) return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  try {
    const data = await new ConvexHttpClient(cfg.url).query(api.support.listTickets, { adminSecret: cfg.secret, statusFilter: filter ? filter as any : undefined, limit: 300 });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("Admin support queue failed:", error); return NextResponse.json({ error: "Unable to load support queue. Check the Convex deployment." }, { status: 502 }); }
}
export async function PATCH(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getSpiderProfile(); const cfg = config();
  if (!user || !cfg) return NextResponse.json({ error: "Support service is not configured." }, { status: 503 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const statuses = ["open", "in_review", "waiting_on_user", "escalated", "resolved", "closed"];
  const priorities = ["low", "normal", "high", "urgent"];
  if (typeof body.ticketId !== "string" || !statuses.includes(String(body.status)) || (body.priority !== undefined && !priorities.includes(String(body.priority)))) return NextResponse.json({ error: "Invalid ticket update." }, { status: 400 });
  try {
    const result = await new ConvexHttpClient(cfg.url).mutation(api.support.updateTicket, {
      adminSecret: cfg.secret, ticketId: body.ticketId as any, actorDiscordId: user.id,
      actorName: user.displayName || user.username, status: body.status as any,
      priority: body.priority as any, assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : undefined,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("Admin ticket update failed:", error); return NextResponse.json({ error: "Unable to update ticket." }, { status: 400 }); }
}
