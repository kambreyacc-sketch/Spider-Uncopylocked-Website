import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getServiceConvex } from "../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Notification storage is not configured." }, { status: 503 });
  try {
    const result = await db.client.query(api.notifications.listMine, { adminSecret: db.secret, recipientDiscordId: user.id });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Notification list failed:", error);
    return NextResponse.json({ error: "Notifications are temporarily unavailable. Deploy the current Convex functions and schema." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Notification storage is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid notification action." }, { status: 400 }); }
  try {
    if (body.action === "readAll") {
      const result = await db.client.mutation(api.notifications.markAllRead, { adminSecret: db.secret, recipientDiscordId: user.id });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    if (body.action === "read" && typeof body.id === "string" && body.id.length > 0 && body.id.length < 100) {
      const result = await db.client.mutation(api.notifications.markRead, { adminSecret: db.secret, notificationId: body.id as any, recipientDiscordId: user.id });
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    return NextResponse.json({ error: "Choose a valid notification action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification update failed.";
    if (/Notification not found/i.test(message)) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    console.error("Notification update failed:", error);
    return NextResponse.json({ error: "Could not update notification." }, { status: 503 });
  }
}
