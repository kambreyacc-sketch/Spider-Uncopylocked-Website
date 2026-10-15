import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin, type SpiderProfile } from "../../../../lib/session";
import { hasStaffCapability } from "../../../../lib/staff-permissions";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sections = ["users", "studios", "jobs", "restrictions", "activity", "settings"] as const;
type Section = typeof sections[number];
const restrictionKinds = ["Warning", "Restricted", "Suspended", "Banned"] as const;
const settingKeys = ["announcement", "announcementEnabled", "homepageFeaturedText"] as const;

async function canView(section: Section, actor: SpiderProfile) {
  if (await isSpiderAdmin()) return true;
  return section === "restrictions" && await hasStaffCapability("restrictions.view", actor);
}
async function canManageRestrictions(actor: SpiderProfile) {
  return (await isSpiderAdmin()) || await hasStaffCapability("restrictions.manage", actor);
}

export async function GET(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor) return NextResponse.json({ error: "Sign in to access administration." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const section = params.get("section") as Section | null;
  if (!section || !sections.includes(section)) return NextResponse.json({ error: "Choose a valid admin section." }, { status: 400 });
  if (!(await canView(section, actor))) return NextResponse.json({ error: "You do not have permission to view this section." }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Admin data service is not configured." }, { status: 503 });
  const page = Number(params.get("page") || "1");
  const pageSize = Number(params.get("pageSize") || "25");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 10 || pageSize > 50) {
    return NextResponse.json({ error: "Invalid pagination settings." }, { status: 400 });
  }
  const search = (params.get("search") || "").slice(0, 120);
  const status = params.get("status")?.slice(0, 60) || undefined;
  try {
    const result = await db.client.query(api.admin.listOperations, {
      adminSecret: db.secret,
      section,
      page,
      pageSize,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin operations list failed:", error);
    return NextResponse.json({ error: "Could not load this administration section. Confirm the current Convex functions are deployed." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor) return NextResponse.json({ error: "Sign in to perform this operation." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid operation request." }, { status: 400 }); }
  const action = typeof body.action === "string" ? body.action : "";
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Admin data service is not configured." }, { status: 503 });

  if (action === "createRestriction") {
    if (!(await canManageRestrictions(actor))) return NextResponse.json({ error: "You do not have permission to issue account restrictions." }, { status: 403 });
    if (body.confirmed !== true) return NextResponse.json({ error: "Confirm this moderation action before saving it." }, { status: 400 });
    if (typeof body.kind !== "string" || !restrictionKinds.includes(body.kind as typeof restrictionKinds[number])) return NextResponse.json({ error: "Choose a valid restriction type." }, { status: 400 });
    const subjectDiscordId = typeof body.subjectDiscordId === "string" ? body.subjectDiscordId.trim() : "";
    const subjectName = typeof body.subjectName === "string" ? body.subjectName.trim().slice(0, 100) : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!/^[0-9]{5,32}$/.test(subjectDiscordId) || !subjectName || reason.length < 3 || reason.length > 2000) return NextResponse.json({ error: "Enter a valid Discord ID, member name, and reason (3–2,000 characters)." }, { status: 400 });
    let expiresAt: number | undefined;
    if (typeof body.expiresAt === "string" && body.expiresAt.trim()) {
      expiresAt = new Date(body.expiresAt).getTime();
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return NextResponse.json({ error: "Expiration must be a valid future date and time." }, { status: 400 });
    }
    try {
      const result = await db.client.mutation(api.admin.createRestriction, {
        adminSecret: db.secret, subjectDiscordId, subjectName,
        kind: body.kind as typeof restrictionKinds[number], reason,
        ...(expiresAt !== undefined ? { expiresAt } : {}),
        actorDiscordId: actor.id, actorName: actor.displayName || actor.username,
        sourceType: typeof body.sourceType === "string" ? body.sourceType.slice(0, 40) : "admin",
        sourceId: typeof body.sourceId === "string" ? body.sourceId.slice(0, 100) : undefined,
      });
      return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not issue restriction." }, { status: 400 });
    }
  }

  if (action === "saveSetting") {
    if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Only the site owner can update website settings." }, { status: 403 });
    if (typeof body.key !== "string" || !settingKeys.includes(body.key as typeof settingKeys[number]) || typeof body.value !== "string") return NextResponse.json({ error: "Choose a supported website setting." }, { status: 400 });
    if (body.value.length > (body.key === "announcement" ? 1000 : 300)) return NextResponse.json({ error: "Setting value is too long." }, { status: 400 });
    try {
      const result = await db.client.mutation(api.admin.saveWebsiteSetting, {
        adminSecret: db.secret, key: body.key as typeof settingKeys[number], value: body.value,
        actorDiscordId: actor.id, actorName: actor.displayName || actor.username,
      });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save setting." }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown admin operation." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const actor = await getSpiderProfile();
  if (!actor) return NextResponse.json({ error: "Sign in to perform this operation." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid operation request." }, { status: 400 }); }
  const action = typeof body.action === "string" ? body.action : "";
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Admin data service is not configured." }, { status: 503 });

  if (action === "liftRestriction") {
    if (!(await canManageRestrictions(actor))) return NextResponse.json({ error: "You do not have permission to lift account restrictions." }, { status: 403 });
    if (body.confirmed !== true) return NextResponse.json({ error: "Confirm this moderation action before saving it." }, { status: 400 });
    if (typeof body.id !== "string" || typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 1000) return NextResponse.json({ error: "Select a restriction and enter a reason (3–1,000 characters)." }, { status: 400 });
    try {
      const result = await db.client.mutation(api.admin.liftRestriction, {
        adminSecret: db.secret, restrictionId: body.id as any,
        actorDiscordId: actor.id, actorName: actor.displayName || actor.username, reason: body.reason.trim(),
      });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not lift restriction." }, { status: 400 });
    }
  }

  if (!(await isSpiderAdmin())) return NextResponse.json({ error: "Only the site owner can change studio and job publication status." }, { status: 403 });
  if (body.confirmed !== true) return NextResponse.json({ error: "Confirm this change before saving it." }, { status: 400 });
  if (typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 1000) return NextResponse.json({ error: "Enter a reason between 3 and 1,000 characters." }, { status: 400 });
  try {
    if (action === "studioStatus") {
      if (typeof body.id !== "string" || !["active", "archived"].includes(String(body.status))) return NextResponse.json({ error: "Choose a valid studio and status." }, { status: 400 });
      const result = await db.client.mutation(api.admin.setStudioStatus, {
        adminSecret: db.secret, studioId: body.id as any, status: body.status as "active" | "archived",
        actorDiscordId: actor.id, actorName: actor.displayName || actor.username, reason: body.reason.trim(),
      });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    if (action === "jobStatus") {
      if (typeof body.id !== "string" || !["open", "closed"].includes(String(body.status))) return NextResponse.json({ error: "Choose a valid job and status." }, { status: 400 });
      const result = await db.client.mutation(api.admin.setJobStatus, {
        adminSecret: db.secret, jobId: body.id as any, status: body.status as "open" | "closed",
        actorDiscordId: actor.id, actorName: actor.displayName || actor.username, reason: body.reason.trim(),
      });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save admin changes." }, { status: 400 });
  }
  return NextResponse.json({ error: "Unknown admin operation." }, { status: 400 });
}
