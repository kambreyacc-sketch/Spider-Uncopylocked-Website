import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../../lib/session";
import { getBillingDb } from "../../../../../lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Studio storage is unavailable." }, { status: 503 });
  try {
    const studio = await db.client.query(api.studios.ownerBySlug, { adminSecret: db.secret, slug, ownerDiscordId: profile.id });
    if (!studio) return NextResponse.json({ error: "Only the studio owner can view applications." }, { status: 403 });
    const applications = await db.client.query(api.studios.applicationsForOwner, { adminSecret: db.secret, studioId: studio.id, ownerDiscordId: profile.id });
    return NextResponse.json({ applications }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Studio applications lookup failed:", error);
    return NextResponse.json({ error: "Could not load applications." }, { status: 502 });
  }
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in with Discord before applying." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Studio storage is unavailable." }, { status: 503 });
  try {
    const body = await request.json();
    const roleId = typeof body.roleId === "string" ? body.roleId : "";
    const studio = await db.client.query(api.studios.bySlug, { adminSecret: db.secret, slug });
    if (!studio) return NextResponse.json({ error: "Studio not found." }, { status: 404 });
    const result = await db.client.mutation(api.studios.applyToRole, {
      adminSecret: db.secret, roleId: roleId as never, applicantDiscordId: profile.id,
      applicantName: profile.displayName || profile.username,
      ...(typeof body.portfolioUrl === "string" && body.portfolioUrl.trim() ? { portfolioUrl: body.portfolioUrl.trim().slice(0, 500) } : {}),
      ...(typeof body.experience === "string" && body.experience.trim() ? { experience: body.experience.trim().slice(0, 1000) } : {}),
      message: typeof body.message === "string" ? body.message : "",
      attachments: Array.isArray(body.attachments) ? body.attachments.filter((x: unknown): x is string => typeof x === "string").slice(0, 5) : [],
    });
    return NextResponse.json({ success: true, applicationId: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit application.";
    return NextResponse.json({ error: message.includes("already applied") || message.includes("no longer accepting") || message.includes("Application message") || message.includes("Portfolio link") ? message : "Could not submit application." }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Studio storage is unavailable." }, { status: 503 });
  try {
    const studio = await db.client.query(api.studios.ownerBySlug, { adminSecret: db.secret, slug, ownerDiscordId: profile.id });
    if (!studio) return NextResponse.json({ error: "Only the studio owner can review applications." }, { status: 403 });
    const body = await request.json();
    if (typeof body.applicationId !== "string" || !["new", "reviewing", "shortlisted", "accepted", "declined"].includes(body.status)) return NextResponse.json({ error: "Invalid application update." }, { status: 400 });
    await db.client.mutation(api.studios.updateApplicationStatus, { adminSecret: db.secret, applicationId: body.applicationId as never, ownerDiscordId: profile.id, status: body.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Studio application update failed:", error);
    return NextResponse.json({ error: "Could not update application." }, { status: 400 });
  }
}
