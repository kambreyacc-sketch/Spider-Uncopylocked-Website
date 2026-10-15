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
  if (!profile) return NextResponse.json({ error: "Sign in with Discord before requesting a studio." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Application storage is not configured. Nothing was submitted." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid studio request." }, { status: 400 }); }
  const text = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const name = text("name", 61), slug = text("slug", 33).toLowerCase(), description = text("description", 1201);
  const specialties = Array.isArray(body.specialties)
    ? body.specialties.filter((value): value is string => typeof value === "string").map(value => value.trim()).filter(Boolean).slice(0, 10).join(", ")
    : text("specialties", 500);
  if (name.length < 3 || name.length > 60 || description.length < 20 || description.length > 1200 || specialties.length < 2) {
    return NextResponse.json({ error: "Add a studio name, a 20–1,200 character description, and at least one specialty." }, { status: 400 });
  }
  const robloxUrl = text("robloxUrl", 500), discordUrl = text("discordUrl", 500);
  try {
    const result = await db.client.mutation(api.applications.submit, {
      adminSecret: db.secret,
      type: "Studio registration",
      subject: name + " studio registration",
      answers: { studioName: name, slug, description, specialties, robloxUrl, discordUrl },
      applicantDiscordId: profile.id,
      applicantName: profile.displayName || profile.username,
      ...(profile.avatar ? { applicantAvatar: profile.avatar } : {}),
    });
    return NextResponse.json({ success: true, applicationNumber: result.applicationNumber, status: "Submitted", message: "Studio request submitted. A studio is created only after an authorized reviewer approves the application." }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Studio request failed.";
    console.error("Studio registration request failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
