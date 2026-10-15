import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getBillingDb } from "../../../lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const db = getBillingDb();
  if (!db) {
    return NextResponse.json(
      { error: "Studio storage is not configured yet.", studios: [], mine: [] },
      { status: 503 },
    );
  }

  const profile = await getSpiderProfile();
  const search = new URL(request.url).searchParams.get("search")?.slice(0, 100) || undefined;
  try {
    const [studios, mine] = await Promise.all([
      db.client.query(api.studios.publicList, { adminSecret: db.secret, search }),
      profile
        ? db.client.query(api.studios.mine, { adminSecret: db.secret, ownerDiscordId: profile.id })
        : Promise.resolve([]),
    ]);
    return NextResponse.json(
      { studios, mine, authenticated: !!profile },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Studio directory lookup failed:", error);
    return NextResponse.json(
      { error: "The studio directory is temporarily unavailable.", studios: [], mine: [] },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const profile = await getSpiderProfile();
  if (!profile) {
    return NextResponse.json({ error: "Sign in with Discord before creating a studio." }, { status: 401 });
  }
  const db = getBillingDb();
  if (!db) {
    return NextResponse.json({ error: "Studio storage is not configured yet. Nothing was published." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid studio form." }, { status: 400 });
  }

  const stringValue = (key: string, max: number) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const specialties = typeof body.specialties === "string"
    ? body.specialties.split(",").map(value => value.trim()).filter(Boolean).slice(0, 10)
    : Array.isArray(body.specialties)
      ? body.specialties.filter((value): value is string => typeof value === "string").map(value => value.trim()).filter(Boolean).slice(0, 10)
      : [];

  try {
    const result = await db.client.mutation(api.studios.create, {
      adminSecret: db.secret,
      name: stringValue("name", 60),
      slug: stringValue("slug", 32).toLowerCase(),
      description: stringValue("description", 1200),
      specialties,
      ownerDiscordId: profile.id,
      ownerName: profile.displayName || profile.username,
      ownerAvatar: profile.avatar || undefined,
      robloxUrl: stringValue("robloxUrl", 500) || undefined,
      discordUrl: stringValue("discordUrl", 500) || undefined,
    });
    return NextResponse.json({ success: true, studio: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Studio creation failed.";
    const expected = /Studio name|Studio handle|Studio description|Sign in with Discord|specialty|specialties|valid HTTPS|already in use/i.test(message);
    console.error("Studio creation failed:", message);
    return NextResponse.json(
      { error: expected ? message : "Studio creation failed. Please try again." },
      { status: expected ? 400 : 502 },
    );
  }
}
