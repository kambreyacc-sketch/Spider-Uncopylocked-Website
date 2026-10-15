import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ number: string }> };

async function numberParam(context: Context) {
  const params = await context.params;
  const number = Number(params.number);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export async function GET(_request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in to view this ticket." }, { status: 401 });
  const ticketNumber = await numberParam(context);
  if (!ticketNumber) return NextResponse.json({ error: "Invalid ticket number." }, { status: 400 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Ticket storage is unavailable." }, { status: 503 });
  try {
    const result = await db.client.query(api.support.getMine, { adminSecret: db.secret, ownerDiscordId: user.id, ticketNumber });
    if (!result) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Ticket detail lookup failed:", error);
    return NextResponse.json({ error: "Ticket detail could not be loaded. Confirm the support functions are deployed." }, { status: 503 });
  }
}

export async function POST(request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in before replying." }, { status: 401 });
  const ticketNumber = await numberParam(context);
  if (!ticketNumber) return NextResponse.json({ error: "Invalid ticket number." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid reply." }, { status: 400 }); }
  if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 8000) return NextResponse.json({ error: "Reply must be between 1 and 8,000 characters." }, { status: 400 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Ticket storage is unavailable." }, { status: 503 });
  try {
    const result = await db.client.mutation(api.support.replyAsMember, {
      adminSecret: db.secret, ticketNumber, ownerDiscordId: user.id,
      ownerName: user.displayName || user.username, ...(user.avatar ? { ownerAvatar: user.avatar } : {}),
      body: body.body.trim(),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reply failed.";
    if (/Ticket not found|closed|Reply must/.test(message)) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Ticket reply failed:", error);
    return NextResponse.json({ error: "Reply could not be saved. Please try again." }, { status: 503 });
  }
}
