import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getServiceConvex } from "../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const crafts = ["Scripting", "Building", "UI/UX", "3D Modeling", "Animation", "VFX", "GFX", "Audio"] as const;

export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before requesting a job post." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Job posting service is not configured. Nothing was submitted." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, {
      adminSecret: db.secret, applicantDiscordId: user.id, type: "Commission / hiring access",
    });
    if (!approved) return NextResponse.json({ error: "Job posting access is not approved for your account yet. Apply for Commission / hiring access first.", applyUrl: "/apply" }, { status: 403 });
  } catch (error) {
    console.error("Job posting access check failed:", error);
    return NextResponse.json({ error: "Could not verify job posting permission. Access remains locked." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid job form." }, { status: 400 }); }
  const text = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0,max) : "";
  const title = text("title",101), description = text("description",3001), craft = text("craft",41);
  const budgetMin = Number(body.budgetMin), budgetMax = Number(body.budgetMax), deadline = text("deadline",10);
  if (title.length < 5 || title.length > 100) return NextResponse.json({ error: "Job title must be 5–100 characters." }, { status: 400 });
  if (description.length < 1 || description.length > 3000) return NextResponse.json({ error: "Description must be 1–3,000 characters." }, { status: 400 });
  if (!crafts.includes(craft as typeof crafts[number])) return NextResponse.json({ error: "Choose a valid development craft." }, { status: 400 });
  if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin < 0 || budgetMax < budgetMin || budgetMax > 1_000_000) return NextResponse.json({ error: "Enter a valid USD budget range." }, { status: 400 });
  if (deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(new Date(deadline+"T23:59:59").getTime()) || new Date(deadline+"T23:59:59").getTime() < Date.now())) return NextResponse.json({ error: "Deadline must be a valid future date." }, { status: 400 });
  try {
    const result = await db.client.mutation(api.developers.postJob, {
      adminSecret: db.secret,
      title, description, craft, budgetMin, budgetMax,
      ...(deadline ? { deadline } : {}),
      discordContact: user.username,
      posterDiscordId: user.id,
      posterName: (user.displayName || user.username).slice(0,40),
    });
    return NextResponse.json({ success: true, jobId: result, status: "pending", message: "Your job was submitted for moderator review and is not publicly visible yet." }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job submission failed.";
    console.error("Job submission failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
