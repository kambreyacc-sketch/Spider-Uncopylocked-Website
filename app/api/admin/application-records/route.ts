import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
import { hasStaffCapability } from "../../../../lib/staff-permissions";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const statuses = ["Draft", "Submitted", "Under Review", "Changes Requested", "Approved", "Rejected", "Escalated", "Withdrawn"] as const;
const decisions = ["Under Review", "Changes Requested", "Approved", "Rejected", "Escalated"] as const;
const types = ["Studio registration", "Resource / leaker upload", "Marketplace posting access", "Developer profile", "Content creator", "Discord staff role", "Commission / hiring access"] as const;

export async function GET(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor || !(await hasStaffCapability("applications.view", actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application storage is not configured." }, { status: 503 });
  const search = new URL(request.url).searchParams;
  const status = search.get("status"), type = search.get("type");
  if (status && !statuses.includes(status as typeof statuses[number])) return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  if (type && !types.includes(type as typeof types[number])) return NextResponse.json({ error: "Invalid application type." }, { status: 400 });
  try {
    const applications = await db.client.query(api.applications.listForStaff, {
      adminSecret: db.secret,
      ...(status ? { status: status as typeof statuses[number] } : {}),
      ...(type ? { type: type as typeof types[number] } : {}),
    });
    return NextResponse.json({ applications }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("Application review queue failed:", error); return NextResponse.json({ error: "Application review queue is not ready. Deploy the current Convex schema and functions." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor || !(await hasStaffCapability("applications.review", actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!actor || !db) return NextResponse.json({ error: "Admin session or application storage is unavailable." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!Number.isSafeInteger(body.applicationNumber) || Number(body.applicationNumber) < 1) return NextResponse.json({ error: "Invalid application number." }, { status: 400 });
  if (typeof body.status !== "string" || !decisions.includes(body.status as typeof decisions[number])) return NextResponse.json({ error: "Invalid application decision." }, { status: 400 });
  if (body.decisionReason !== undefined && (typeof body.decisionReason !== "string" || body.decisionReason.length > 2000)) return NextResponse.json({ error: "Decision reason is too long." }, { status: 400 });
  if (body.staffNote !== undefined && (typeof body.staffNote !== "string" || body.staffNote.length > 4000)) return NextResponse.json({ error: "Private note is too long." }, { status: 400 });
  try {
    const target = await db.client.query(api.applications.getForStaff, { adminSecret: db.secret, applicationNumber: Number(body.applicationNumber) });
    if (!target) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    if (target.application.applicantDiscordId === actor.id) return NextResponse.json({ error: "You cannot review your own application." }, { status: 403 });
    if (body.status === "Approved" && target.application.type === "Discord staff role" && !(await isSpiderAdmin())) return NextResponse.json({ error: "Only the repository owner can approve staff role grants." }, { status: 403 });
    const result = await db.client.mutation(api.applications.review, {
      adminSecret: db.secret, applicationNumber: Number(body.applicationNumber),
      actorDiscordId: actor.id, actorName: actor.displayName || actor.username,
      status: body.status as typeof decisions[number],
      ...(typeof body.decisionReason === "string" ? { decisionReason: body.decisionReason } : {}),
      ...(typeof body.staffNote === "string" ? { staffNote: body.staffNote } : {}),
      ...(body.assignToMe === true ? { assignedToDiscordId: actor.id, assignedToName: actor.displayName || actor.username } : typeof body.assignedToDiscordId === "string" ? { assignedToDiscordId: body.assignedToDiscordId, assignedToName: typeof body.assignedToName === "string" ? body.assignedToName : undefined } : {}),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("Application decision failed:", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save decision." }, { status: 400 }); }
}
