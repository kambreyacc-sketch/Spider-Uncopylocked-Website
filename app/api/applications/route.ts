import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
export const dynamic = "force-dynamic";
const types = ["Studio Registration", "Posting Access", "Content Creator", "Staff Application", "Hiring Access"];
function config() { const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL; const secret = process.env.CONVEX_ADMIN_API_SECRET; return url && secret ? { url, secret } : null; }
async function restrictions(client: ConvexHttpClient, secret: string, userId: string) {
  return await client.query(api.admin.getActiveRestrictionsForUser, { adminSecret: secret, targetDiscordId: userId });
}
export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view your applications." }, { status: 401 });
  const cfg = config(); if (!cfg) return NextResponse.json({ error: "Application service is not configured." }, { status: 503 });
  try {
    const applications = await new ConvexHttpClient(cfg.url).query(api.applications.listMine, { adminSecret: cfg.secret, applicantDiscordId: user.id });
    return NextResponse.json({ applications }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("List own applications failed:", error); return NextResponse.json({ error: "Could not load your applications." }, { status: 502 }); }
}
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before applying." }, { status: 401 });
  const cfg = config(); if (!cfg) return NextResponse.json({ error: "Application service is not configured." }, { status: 503 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.applicationType !== "string" || !types.includes(body.applicationType)) return NextResponse.json({ error: "Choose a valid application type." }, { status: 400 });
  if (typeof body.title !== "string" || typeof body.summary !== "string" || !Array.isArray(body.answers) || !body.answers.every(a => a && typeof a === "object" && typeof a.key === "string" && typeof a.label === "string" && typeof a.value === "string")) return NextResponse.json({ error: "Complete the application fields." }, { status: 400 });
  const links = typeof body.linksText === "string" ? body.linksText.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  const client = new ConvexHttpClient(cfg.url);
  try {
    const active = await restrictions(client, cfg.secret, user.id);
    if (active.some(r => ["restricted", "temporary_ban", "permanent_ban"].includes(r.restrictionType))) return NextResponse.json({ error: "Your account is restricted from submitting applications while this action is active." }, { status: 403 });
    if (["Posting Access", "Hiring Access"].includes(body.applicationType) && active.some(r => r.restrictionType === "posting_ban")) return NextResponse.json({ error: "Your account cannot request posting access while a posting restriction is active." }, { status: 403 });
    const id = await client.mutation(api.applications.submit, {
      adminSecret: cfg.secret, applicationType: body.applicationType as any,
      applicantDiscordId: user.id, applicantName: user.displayName || user.username,
      title: body.title, summary: body.summary, links, answers: body.answers as any[],
    });
    return NextResponse.json({ applicationId: id, status: "pending" }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application submission failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
