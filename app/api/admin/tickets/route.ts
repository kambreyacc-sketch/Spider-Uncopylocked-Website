import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const statuses = ["Open", "In Review", "Waiting on User", "Escalated", "Resolved", "Closed"] as const;
const priorities = ["Low", "Normal", "High", "Urgent"] as const;

export async function GET(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Support storage is not configured." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const numberValue = params.get("number");
  if (numberValue !== null) {
    const ticketNumber = Number(numberValue);
    if (!Number.isSafeInteger(ticketNumber) || ticketNumber < 1) return NextResponse.json({ error: "Invalid ticket number." }, { status: 400 });
    try {
      const detail = await db.client.query(api.support.getForStaff, { adminSecret: db.secret, ticketNumber });
      if (!detail) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
      return NextResponse.json(detail, { headers: { "Cache-Control": "no-store, max-age=0" } });
    } catch (error) {
      console.error("Admin ticket detail failed:", error);
      return NextResponse.json({ error: "Ticket detail is not ready. Confirm the support functions have been deployed." }, { status: 503 });
    }
  }
  const statusValue = params.get("status");
  if (statusValue && !statuses.includes(statusValue as typeof statuses[number])) return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  try {
    const tickets = await db.client.query(api.support.listForStaff, { adminSecret: db.secret, ...(statusValue ? { status: statusValue as typeof statuses[number] } : {}) });
    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin ticket queue failed:", error);
    return NextResponse.json({ error: "Ticket queue is not ready. Deploy the current Convex schema and support functions." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actor = await getSpiderProfile();
  const db = getServiceConvex();
  if (!actor || !db) return NextResponse.json({ error: "Admin session or support storage is unavailable." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!Number.isSafeInteger(body.ticketNumber) || Number(body.ticketNumber) < 1) return NextResponse.json({ error: "Invalid ticket number." }, { status: 400 });
  if (body.status !== undefined && !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (body.priority !== undefined && !priorities.includes(body.priority as typeof priorities[number])) return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
  if (body.reply !== undefined && (typeof body.reply !== "string" || body.reply.trim().length > 8000)) return NextResponse.json({ error: "Reply must be under 8,000 characters." }, { status: 400 });
  if (body.visibility !== undefined && !["public", "internal"].includes(String(body.visibility))) return NextResponse.json({ error: "Invalid reply visibility." }, { status: 400 });
  try {
    const result = await db.client.mutation(api.support.staffUpdate, {
      adminSecret: db.secret, ticketNumber: Number(body.ticketNumber),
      actorDiscordId: actor.id, actorName: actor.displayName || actor.username,
      ...(typeof body.status === "string" ? { status: body.status as typeof statuses[number] } : {}),
      ...(typeof body.priority === "string" ? { priority: body.priority as typeof priorities[number] } : {}),
      ...(typeof body.assignedToDiscordId === "string" ? { assignedToDiscordId: body.assignedToDiscordId, assignedToName: typeof body.assignedToName === "string" ? body.assignedToName : undefined } : {}),
      ...(typeof body.reply === "string" && body.reply.trim() ? { reply: body.reply.trim(), visibility: (body.visibility === "internal" ? "internal" : "public") as "public" | "internal" } : {}),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin ticket update failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket update failed." }, { status: 400 });
  }
}
