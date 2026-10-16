import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = (process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);
  return url && secret ? { url, secret } : null;
}
export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view your tickets." }, { status: 401 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  try {
    const tickets = await new ConvexHttpClient(cfg.url).query(api.support.listMyTickets, {
      adminSecret: cfg.secret, applicantDiscordId: user.id
    });
    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("List own support tickets failed:", error);
    return NextResponse.json({ error: "Unable to load tickets." }, { status: 502 });
  }
}
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before submitting a ticket." }, { status: 401 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: "Support database is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const categories = ["Account Appeal", "Report a Scammer", "Report Content", "Technical Support", "Studio Request", "General Support"];
  if (typeof body.category !== "string" || !categories.includes(body.category)) return NextResponse.json({ error: "Choose a valid ticket category." }, { status: 400 });
  if (typeof body.subject !== "string" || body.subject.trim().length < 2 || body.subject.length > 120) return NextResponse.json({ error: "Subject must be 2–120 characters." }, { status: 400 });
  if (typeof body.description !== "string" || body.description.trim().length < 20 || body.description.length > 5000) return NextResponse.json({ error: "Description must be 20–5,000 characters." }, { status: 400 });
  for (const key of ["reference", "department", "actionTaken"]) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 500)) return NextResponse.json({ error: "An optional field is invalid or too long." }, { status: 400 });
  }
  if (body.category === "Account Appeal" && (!body.department || !body.actionTaken)) return NextResponse.json({ error: "Choose the department and action being appealed." }, { status: 400 });
  try {
    const created = await new ConvexHttpClient(cfg.url).mutation(api.support.createTicket, {
      adminSecret: cfg.secret, category: body.category as any, subject: body.subject.trim(),
      reference: typeof body.reference === "string" ? body.reference.trim() : undefined,
      department: typeof body.department === "string" ? body.department : undefined,
      actionTaken: typeof body.actionTaken === "string" ? body.actionTaken : undefined,
      description: body.description.trim(), attachments: Array.isArray(body.attachments) ? body.attachments.filter((x): x is string => typeof x === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/.test(x) && x.length <= 300000).slice(0, 3) : undefined, applicantDiscordId: user.id,
      applicantName: user.displayName || user.username,
    });
    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Create support ticket failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create ticket." }, { status: 502 });
  }
}
