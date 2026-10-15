import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized messaging service request.");
  }
}

function assertParticipant(conversation: { participantOne: string; participantTwo: string }, discordId: string) {
  if (conversation.participantOne !== discordId && conversation.participantTwo !== discordId) {
    throw new Error("You do not have access to this conversation.");
  }
}

export const listConversations = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const [asFirst, asSecond] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_participantOne_updatedAt", q => q.eq("participantOne", args.discordId)).order("desc").take(100),
      ctx.db.query("conversations").withIndex("by_participantTwo_updatedAt", q => q.eq("participantTwo", args.discordId)).order("desc").take(100),
    ]);
    const all = [...asFirst, ...asSecond].sort((a, b) => b.updatedAt - a.updatedAt);
    const unique = new Map<string, (typeof all)[number]>();
    for (const conversation of all) unique.set(conversation._id, conversation);
    return [...unique.values()].map(({ _id, _creationTime, ...conversation }) => ({
      id: _id,
      ...conversation,
      otherDiscordId: conversation.participantOne === args.discordId ? conversation.participantTwo : conversation.participantOne,
      otherName: conversation.participantOne === args.discordId ? conversation.participantTwoName : conversation.participantOneName,
      otherAvatar: conversation.participantOne === args.discordId ? conversation.participantTwoAvatar : conversation.participantOneAvatar,
    }));
  },
});

export const listMessages = query({
  args: { adminSecret: v.string(), discordId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    const messages = await ctx.db.query("messages")
      .withIndex("by_conversation_createdAt", q => q.eq("conversationId", args.conversationId))
      .order("desc").take(100);
    return messages.reverse().map(({ _id, _creationTime, ...message }) => ({ id: _id, ...message }));
  },
});

export const startConversation = mutation({
  args: {
    adminSecret: v.string(),
    senderDiscordId: v.string(),
    senderName: v.string(),
    senderAvatar: v.optional(v.string()),
    recipientDiscordId: v.string(),
    contextType: v.optional(v.string()),
    contextTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!args.senderDiscordId || args.senderDiscordId === args.recipientDiscordId) throw new Error("Choose another creator to message.");
    const recipient = await ctx.db.query("developers")
      .withIndex("by_discord", q => q.eq("discordId", args.recipientDiscordId))
      .first();
    if (!recipient || recipient.status !== "approved") throw new Error("This creator does not have an active public developer profile.");
    const oneFirst = args.senderDiscordId < args.recipientDiscordId;
    const participantOne = oneFirst ? args.senderDiscordId : args.recipientDiscordId;
    const participantTwo = oneFirst ? args.recipientDiscordId : args.senderDiscordId;
    const existing = await ctx.db.query("conversations")
      .withIndex("by_participants", q => q.eq("participantOne", participantOne).eq("participantTwo", participantTwo))
      .unique();
    if (existing) return { id: existing._id, created: false };
    const senderName = args.senderName.trim().slice(0, 80) || "Spider creator";
    const recipientName = recipient.displayName || recipient.username;
    const id = await ctx.db.insert("conversations", {
      participantOne,
      participantTwo,
      participantOneName: oneFirst ? senderName : recipientName,
      participantTwoName: oneFirst ? recipientName : senderName,
      ...(oneFirst
        ? { ...(args.senderAvatar ? { participantOneAvatar: args.senderAvatar } : {}), ...(recipient.avatarUrl ? { participantTwoAvatar: recipient.avatarUrl } : {}) }
        : { ...(recipient.avatarUrl ? { participantOneAvatar: recipient.avatarUrl } : {}), ...(args.senderAvatar ? { participantTwoAvatar: args.senderAvatar } : {}) }),
      ...(args.contextType ? { contextType: args.contextType.slice(0, 32) } : {}),
      ...(args.contextTitle ? { contextTitle: args.contextTitle.trim().slice(0, 120) } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id, created: true };
  },
});

export const sendMessage = mutation({
  args: {
    adminSecret: v.string(),
    discordId: v.string(),
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    const body = args.body.trim();
    if (!body || body.length > 2000) throw new Error("Messages must contain 1–2,000 characters.");
    const now = Date.now();
    const id = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderDiscordId: args.discordId,
      body,
      createdAt: now,
      readBy: [args.discordId],
    });
    await ctx.db.patch(args.conversationId, {
      lastMessageText: body.slice(0, 180),
      updatedAt: now,
    });
    return { id, createdAt: now };
  },
});

export const markRead = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    const messages = await ctx.db.query("messages")
      .withIndex("by_conversation_createdAt", q => q.eq("conversationId", args.conversationId))
      .order("desc").take(100);
    await Promise.all(messages.filter(message => !message.readBy.includes(args.discordId)).map(message =>
      ctx.db.patch(message._id, { readBy: [...message.readBy, args.discordId] })
    ));
    return { success: true };
  },
});
