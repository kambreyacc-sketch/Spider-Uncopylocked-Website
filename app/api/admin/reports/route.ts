import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";
import { hasStaffCapability } from "../../../../lib/staff-permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const statuses = ["submitted", "pending", "under_investigation", "additional_information_requested", "action_taken", "dismissed", "closed"] as const;

export async function GET(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor || !(await hasStaffCapability("reports.view", actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Report storage is not configured." }, { status: 503 });
  const status = new URL(request.url).searchParams.get("status");
  if (status && !statuses.includes(status as typeof statuses[number])) return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
  try {
    const reports = await db.client.query(api.scamReports.listForStaff, { adminSecret: db.secret, ...(status ? { status: status as typeof statuses[number] } : {}) });
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Staff report queue failed:", error);
    return NextResponse.json({ error: "Report review storage is not ready. Confirm the latest Convex schema and functions are deployed." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor || !(await hasStaffCapability("reports.review", actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Report storage is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (!reference || reference.length > 40) return NextResponse.json({ error: "Enter a valid report reference." }, { status: 400 });
  if (typeof body.status !== "string" || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "Choose a valid report status." }, { status: 400 });
  if (body.reviewNotes !== undefined && (typeof body.reviewNotes !== "string" || body.reviewNotes.length > 3000)) return NextResponse.json({ error: "Review notes must be 3,000 characters or fewer." }, { status: 400 });
  try {
    const result = await db.client.mutation(api.scamReports.updateForStaff, {
      adminSecret: db.secret, reference, status: body.status as typeof statuses[number],
      actorDiscordId: actor.id, actorName: actor.displayName || actor.username,
      ...(typeof body.reviewNotes === "string" ? { reviewNotes: body.reviewNotes } : {}),
      ...(body.assignToMe === true ? { assignedToDiscordId: actor.id, assignedToName: actor.displayName || actor.username }
        : typeof body.assignedToDiscordId === "string" ? { assignedToDiscordId: body.assignedToDiscordId, assignedToName: typeof body.assignedToName === "string" ? body.assignedToName : undefined } : {}),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
