import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../../lib/session";
import { getBillingDb } from "../../../../../lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Studio storage is unavailable." }, { status: 503 });
  try {
    const profile = await getSpiderProfile();

    // Owners need to see every role (including closed roles) and their studio's
    // moderation status. Public visitors only receive approved studios/open roles.
    if (profile) {
      const ownedStudio = await db.client.query(api.studios.ownerBySlug, {
        adminSecret: db.secret, slug, ownerDiscordId: profile.id,
      });
      if (ownedStudio) {
        const roles = await db.client.query(api.studios.rolesForOwner, {
          adminSecret: db.secret, studioId: ownedStudio.id, ownerDiscordId: profile.id,
        });
        return NextResponse.json(
          { studio: ownedStudio, roles, isOwner: true },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    const [studio, roles] = await Promise.all([
      db.client.query(api.studios.bySlug, { adminSecret: db.secret, slug }),
      db.client.query(api.studios.openRoles, { adminSecret: db.secret, slug }),
    ]);
    if (!studio) return NextResponse.json({ error: "Studio not found." }, { status: 404 });
    return NextResponse.json({ studio, roles, isOwner: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Studio roles lookup failed:", error);
    return NextResponse.json({ error: "Could not load studio roles." }, { status: 502 });
  }
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in with Discord to manage your studio." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Studio storage is unavailable." }, { status: 503 });
  try {
    const studio = await db.client.query(api.studios.ownerBySlug, { adminSecret: db.secret, slug, ownerDiscordId: profile.id });
    if (!studio) return NextResponse.json({ error: "Only the studio owner can create roles." }, { status: 403 });
    if (studio.status !== "active") return NextResponse.json({ error: "Your studio must be approved before you can publish open roles." }, { status: 409 });
    const body = await request.json();
    const roleId = await db.client.mutation(api.studios.createRole, {
      adminSecret: db.secret, studioId: studio.id, ownerDiscordId: profile.id,
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : "",
      roleType: ["Full-time", "Contract", "Commission", "Volunteer"].includes(body.roleType) ? body.roleType : "Contract",
      compensation: typeof body.compensation === "string" ? body.compensation : "Discussed with applicants",
    });
    return NextResponse.json({ success: true, roleId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create role.";
    return NextResponse.json({ error: message.includes("Role title") || message.includes("Role description") || message.includes("Compensation") ? message : "Could not create role." }, { status: 400 });
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
    if (!studio) return NextResponse.json({ error: "Only the studio owner can manage roles." }, { status: 403 });
    const body = await request.json();
    if (body.action !== "status" || typeof body.roleId !== "string" || !["open", "closed"].includes(body.status)) return NextResponse.json({ error: "Invalid role update." }, { status: 400 });
    await db.client.mutation(api.studios.manageRole, { adminSecret: db.secret, roleId: body.roleId as never, ownerDiscordId: profile.id, status: body.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Studio role update failed:", error);
    return NextResponse.json({ error: "Could not update this role." }, { status: 400 });
  }
}
