import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getBillingDb } from "../../../lib/stripe";
import { checkAccountRestriction } from "../../../lib/account-restrictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in with Discord to use private messages." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Private messaging storage is not configured yet." }, { status: 503 });
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  try {
    const conversations = await db.client.query(api.messages.listConversations, {
      adminSecret: db.secret,
      discordId: profile.id,
    });
    if (!conversationId) {
      return NextResponse.json({ conversations }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    const messages = await db.client.query(api.messages.listMessages, {
      adminSecret: db.secret,
      discordId: profile.id,
      conversationId,
    });
    return NextResponse.json(
      { conversations, messages },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Private message lookup failed:", error);
    return NextResponse.json({ error: "Messages are temporarily unavailable." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const profile = await getSpiderProfile();
  if (!profile) return NextResponse.json({ error: "Sign in with Discord before sending a message." }, { status: 401 });
  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Private messaging storage is not configured yet." }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Send a valid message request." }, { status: 400 }); }

  if (body.action === "start" || body.action === "send") {
    const restriction = await checkAccountRestriction(profile.id, "message");
    if (restriction.status === "unavailable") return NextResponse.json({ error: "Could not verify your account standing. Messaging is temporarily unavailable." }, { status: 503 });
    if (restriction.status === "blocked") return NextResponse.json({ error: "Messaging is blocked by an active " + restriction.kind.toLowerCase() + " action: " + restriction.reason }, { status: 403 });
  }

  try {
    if (body.action === "start") {
      const recipientDiscordId = typeof body.recipientDiscordId === "string" ? body.recipientDiscordId.trim() : "";
      if (!recipientDiscordId || recipientDiscordId.length > 32) {
        return NextResponse.json({ error: "Choose a valid creator profile to message." }, { status: 400 });
      }
      const result = await db.client.mutation(api.messages.startConversation, {
        adminSecret: db.secret,
        senderDiscordId: profile.id,
        senderName: profile.displayName || profile.username,
        ...(profile.avatar ? { senderAvatar: profile.avatar } : {}),
        recipientDiscordId,
        ...(typeof body.contextType === "string" ? { contextType: body.contextType.slice(0, 32) } : {}),
        ...(typeof body.contextTitle === "string" ? { contextTitle: body.contextTitle.slice(0, 120) } : {}),
      });
      return NextResponse.json({ success: true, conversationId: result.id, created: result.created });
    }

    if (body.action === "send") {
      const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
      const message = typeof body.body === "string" ? body.body.trim() : "";
      if (!conversationId || !message || message.length > 2000) {
        return NextResponse.json({ error: "Choose a conversation and enter a message of 1–2,000 characters." }, { status: 400 });
      }
      const result = await db.client.mutation(api.messages.sendMessage, {
        adminSecret: db.secret,
        discordId: profile.id,
        conversationId,
        body: message,
      });
      return NextResponse.json({ success: true, message: result });
    }

    if (body.action === "read") {
      const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
      if (!conversationId) return NextResponse.json({ error: "Choose a conversation first." }, { status: 400 });
      await db.client.mutation(api.messages.markRead, {
        adminSecret: db.secret,
        discordId: profile.id,
        conversationId,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown message action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message action failed.";
    const expected = /Choose another creator|active public developer profile|access to this conversation|Conversation not found|Messages must contain/i.test(message);
    console.error("Private message action failed:", message);
    return NextResponse.json({ error: expected ? message : "The message could not be sent. Please try again." }, { status: expected ? 400 : 502 });
  }
}
