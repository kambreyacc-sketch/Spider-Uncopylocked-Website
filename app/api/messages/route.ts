import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getBillingDb } from "../../../lib/stripe";

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

    if (body.action === "accept" || body.action === "decline") {
      const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
      if (!conversationId) return NextResponse.json({ error: "Choose a message request first." }, { status: 400 });
      const action = body.action === "accept" ? api.messages.acceptRequest : api.messages.declineRequest;
      await db.client.mutation(action, { adminSecret: db.secret, discordId: profile.id, conversationId });
      return NextResponse.json({ success: true });
    }

    if (body.action === "block") {
      const targetDiscordId = typeof body.targetDiscordId === "string" ? body.targetDiscordId : "";
      if (!targetDiscordId) return NextResponse.json({ error: "Choose a member to block." }, { status: 400 });
      await db.client.mutation(api.messages.blockMember, { adminSecret: db.secret, discordId: profile.id, targetDiscordId });
      return NextResponse.json({ success: true });
    }

    if (body.action === "report") {
      const messageId = typeof body.messageId === "string" ? body.messageId : "";
      const reason = typeof body.reason === "string" ? body.reason : "";
      const details = typeof body.details === "string" ? body.details : "";
      if (!messageId || !reason.trim()) return NextResponse.json({ error: "Choose a reason for the report." }, { status: 400 });
      await db.client.mutation(api.messages.reportMessage, {
        adminSecret: db.secret, discordId: profile.id, messageId, reason, ...(details ? { details } : {}),
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "edit") {
      const messageId = typeof body.messageId === "string" ? body.messageId : "";
      const message = typeof body.body === "string" ? body.body.trim() : "";
      if (!messageId || !message || message.length > 2000) return NextResponse.json({ error: "Enter a message of 1–2,000 characters." }, { status: 400 });
      await db.client.mutation(api.messages.editMessage, { adminSecret: db.secret, discordId: profile.id, messageId, body: message });
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      const messageId = typeof body.messageId === "string" ? body.messageId : "";
      if (!messageId) return NextResponse.json({ error: "Choose a message to delete." }, { status: 400 });
      await db.client.mutation(api.messages.deleteMessage, { adminSecret: db.secret, discordId: profile.id, messageId });
      return NextResponse.json({ success: true });
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
    const expected = /Choose another member|active public developer profile|access to this conversation|Conversation not found|Messages must contain|message request|Accept this message request|You can only edit|Deleted messages|Choose a reason|already reported|Messaging is unavailable|introduction|cannot message/i.test(message);
    console.error("Private message action failed:", message);
    return NextResponse.json({ error: expected ? message : "The message could not be sent. Please try again." }, { status: expected ? 400 : 502 });
  }
}
