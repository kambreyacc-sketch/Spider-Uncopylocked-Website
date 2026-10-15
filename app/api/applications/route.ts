import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getServiceConvex } from "../../../lib/service-convex";
import { checkAccountRestriction } from "../../../lib/account-restrictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const types = ["Studio registration", "Resource / leaker upload", "Marketplace posting access", "Developer profile", "Content creator", "Discord staff role", "Commission / hiring access"] as const;

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in to view your applications." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application storage is not configured." }, { status: 503 });
  try {
    const applications = await db.client.query(api.applications.listMine, { adminSecret: db.secret, applicantDiscordId: user.id });
    return NextResponse.json({ applications }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Applications list failed:", error);
    return NextResponse.json({ error: "Application storage is not ready. Confirm the Convex schema and functions have been deployed." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before applying." }, { status: 401 });
  const restriction = await checkAccountRestriction(user.id, "apply");
  if (restriction.status === "unavailable") return NextResponse.json({ error: "Could not verify your account standing. Nothing was submitted; try again later." }, { status: 503 });
  if (restriction.status === "blocked") return NextResponse.json({ error: "Application submission is blocked by an active " + restriction.kind.toLowerCase() + " action: " + restriction.reason }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application storage is not configured. Nothing was submitted." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid application form." }, { status: 400 }); }
  if (typeof body.type !== "string" || !types.includes(body.type as typeof types[number])) return NextResponse.json({ error: "Choose a valid application type." }, { status: 400 });
  if (typeof body.subject !== "string" || typeof body.answers !== "object" || !body.answers || Array.isArray(body.answers)) return NextResponse.json({ error: "Fill in the required application fields." }, { status: 400 });
  try {
    const intent = body.intent === "draft" ? "draft" : "submit";
    const args = {
      adminSecret: db.secret,
      ...(Number.isSafeInteger(body.applicationNumber) && Number(body.applicationNumber) > 0 ? { applicationNumber: Number(body.applicationNumber) } : {}),
      type: body.type as typeof types[number],
      subject: body.subject.trim().slice(0, 121),
      answers: body.answers,
      applicantDiscordId: user.id,
      applicantName: user.displayName || user.username,
      ...(user.avatar ? { applicantAvatar: user.avatar } : {}),
    };
    const result = intent === "draft"
      ? await db.client.mutation(api.applications.saveDraft, args)
      : await db.client.mutation(api.applications.submit, args);
    return NextResponse.json(result, { status: intent === "draft" ? 200 : 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application submission failed.";
    const expected = /Application title|Application answers|Sign in|active application|application limit|too large/i.test(message);
    if (!expected) console.error("Application submission failed:", error);
    return NextResponse.json({ error: expected ? message : "Application could not be saved. Please try again later." }, { status: expected ? 400 : 503 });
  }
}
