import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getServiceConvex } from "../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const categories = ["Account Appeal", "Report a Scammer", "Report Content", "Technical Support", "Studio Request", "General Support"] as const;

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view your tickets." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Support storage is not configured. No ticket data was changed." }, { status: 503 });
  try {
    const tickets = await db.client.query(api.support.listMine, { adminSecret: db.secret, ownerDiscordId: user.id });
    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Ticket list failed:", error);
    return NextResponse.json({ error: "Ticket storage is not ready. Confirm the Convex schema and support functions have been deployed." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before creating a ticket." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Support storage is not configured. Nothing was submitted." }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid support form." }, { status: 400 }); }
  if (typeof body.category !== "string" || !categories.includes(body.category as typeof categories[number])) return NextResponse.json({ error: "Choose a valid support category." }, { status: 400 });
  const text = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const subject = text("subject", 121), description = text("description", 8001);
  if (subject.length < 4 || subject.length > 120 || description.length < 20 || description.length > 8000) return NextResponse.json({ error: "Add a subject (4–120 characters) and a detailed description (20–8,000 characters)." }, { status: 400 });
  const optional = (key: string, max: number) => text(key, max) || undefined;
  try {
    const result = await db.client.mutation(api.support.createTicket, {
      adminSecret: db.secret,
      ownerDiscordId: user.id,
      ownerName: user.displayName || user.username,
      ...(user.avatar ? { ownerAvatar: user.avatar } : {}),
      category: body.category as typeof categories[number],
      subject,
      description,
      ...(optional("department",120) ? { department: optional("department",120) } : {}),
      ...(optional("actionTaken",160) ? { actionTaken: optional("actionTaken",160) } : {}),
      ...(optional("infractionId",100) ? { infractionId: optional("infractionId",100) } : {}),
    });
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket submission failed.";
    const expected = /Subject|Description|appeal|Infraction|Too many tickets|already have an open ticket|Sign in/.test(message);
    if (!expected) console.error("Ticket submission failed:", error);
    return NextResponse.json({ error: expected ? message : "Ticket could not be saved. Please try again later." }, { status: expected ? 400 : 503 });
  }
}
