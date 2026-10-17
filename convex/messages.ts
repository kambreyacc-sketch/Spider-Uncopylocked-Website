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
function isBlockedByEither(blocks: Array<{ blockerDiscordId: string; blockedDiscordId: string }>, one: string, two: string) {
  return blocks.some(block => (block.blockerDiscordId === one && block.blockedDiscordId === two) ||
    (block.blockerDiscordId === two && block.blockedDiscordId === one));
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
    const blocks = await ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", args.discordId)).collect();
    return [...unique.values()]
      .filter(conversation => !blocks.some(block => block.blockedDiscordId === (conversation.participantOne === args.discordId ? conversation.participantTwo : conversation.participantOne)))
      .map(({ _id, _creationTime, ...conversation }) => ({
        id: _id,
        ...conversation,
        requestStatus: conversation.requestStatus ?? "accepted",
        isIncomingRequest: (conversation.requestStatus ?? "accepted") === "pending" && conversation.requestedBy !== args.discordId,
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
    const requestStatus = conversation.requestStatus ?? "accepted";
    if (requestStatus === "declined") throw new Error("This message request was declined.");
    const messages = await ctx.db.query("messages").withIndex("by_conversation_createdAt", q => q.eq("conversationId", args.conversationId)).order("desc").take(100);
    return messages.reverse().map(({ _id, _creationTime, ...message }) => ({ id: _id, ...message, body: message.deletedAt ? "Message deleted" : message.body }));
  },
});

export const startConversation = mutation({
  args: {
    adminSecret: v.string(), senderDiscordId: v.string(), senderName: v.string(), senderAvatar: v.optional(v.string()),
    recipientDiscordId: v.string(), contextType: v.optional(v.string()), contextTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!args.senderDiscordId || args.senderDiscordId === args.recipientDiscordId) throw new Error("Choose another member to message.");
    const recipient = await ctx.db.query("developers").withIndex("by_discord", q => q.eq("discordId", args.recipientDiscordId)).first();
    if (!recipient || recipient.status !== "approved") throw new Error("This member does not have an active public developer profile yet.");
    const [senderBlocks, recipientBlocks] = await Promise.all([
      ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", args.senderDiscordId)).collect(),
      ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", args.recipientDiscordId)).collect(),
    ]);
    if (isBlockedByEither([...senderBlocks, ...recipientBlocks], args.senderDiscordId, args.recipientDiscordId)) throw new Error("You cannot message this member.");
    const oneFirst = args.senderDiscordId < args.recipientDiscordId;
    const participantOne = oneFirst ? args.senderDiscordId : args.recipientDiscordId;
    const participantTwo = oneFirst ? args.recipientDiscordId : args.senderDiscordId;
    const existing = await ctx.db.query("conversations").withIndex("by_participants", q => q.eq("participantOne", participantOne)).filter(q => q.eq(q.field("participantTwo"), participantTwo)).first();
    if (existing) {
      if (existing.requestStatus === "declined") {
        await ctx.db.patch(existing._id, { requestStatus: "pending", requestedBy: args.senderDiscordId, updatedAt: Date.now() });
        return { id: existing._id, created: true, requestStatus: "pending" };
      }
      return { id: existing._id, created: false, requestStatus: existing.requestStatus ?? "accepted" };
    }
    const senderName = args.senderName.trim().slice(0, 80) || "Spider member";
    const recipientName = recipient.displayName || recipient.username;
    const id = await ctx.db.insert("conversations", {
      participantOne, participantTwo,
      participantOneName: oneFirst ? senderName : recipientName,
      participantTwoName: oneFirst ? recipientName : senderName,
      ...(oneFirst
        ? { ...(args.senderAvatar ? { participantOneAvatar: args.senderAvatar } : {}), ...(recipient.avatarUrl ? { participantTwoAvatar: recipient.avatarUrl } : {}) }
        : { ...(recipient.avatarUrl ? { participantOneAvatar: recipient.avatarUrl } : {}), ...(args.senderAvatar ? { participantTwoAvatar: args.senderAvatar } : {}) }),
      ...(args.contextType ? { contextType: args.contextType.slice(0, 32) } : {}),
      ...(args.contextTitle ? { contextTitle: args.contextTitle.trim().slice(0, 120) } : {}),
      requestStatus: "pending", requestedBy: args.senderDiscordId, createdAt: Date.now(), updatedAt: Date.now(),
    });
    return { id, created: true, requestStatus: "pending" };
  },
});

export const acceptRequest = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    if ((conversation.requestStatus ?? "accepted") !== "pending" || conversation.requestedBy === args.discordId) throw new Error("This is not an incoming message request.");
    const blocks = await ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", args.discordId)).collect();
    if (blocks.some(block => block.blockedDiscordId === conversation.requestedBy)) throw new Error("Unblock this member before accepting their request.");
    await ctx.db.patch(args.conversationId, { requestStatus: "accepted", updatedAt: Date.now() });
    return { success: true };
  },
});

export const declineRequest = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    if ((conversation.requestStatus ?? "accepted") !== "pending" || conversation.requestedBy === args.discordId) throw new Error("This is not an incoming message request.");
    await ctx.db.patch(args.conversationId, { requestStatus: "declined", updatedAt: Date.now() });
    return { success: true };
  },
});

export const sendMessage = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    const requestStatus = conversation.requestStatus ?? "accepted";
    if (requestStatus === "declined") throw new Error("This message request was declined.");
    if (requestStatus === "pending" && conversation.requestedBy !== args.discordId) throw new Error("Accept this message request before replying.");
    const otherDiscordId = conversation.participantOne === args.discordId ? conversation.participantTwo : conversation.participantOne;
    const [myBlocks, theirBlocks] = await Promise.all([
      ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", args.discordId)).collect(),
      ctx.db.query("messageBlocks").withIndex("by_blocker", q => q.eq("blockerDiscordId", otherDiscordId)).collect(),
    ]);
    if (isBlockedByEither([...myBlocks, ...theirBlocks], args.discordId, otherDiscordId)) throw new Error("Messaging is unavailable between these accounts.");
    const body = args.body.trim();
    if (!body || body.length > 2000) throw new Error("Messages must contain 1–2,000 characters.");
    if (requestStatus === "pending" && conversation.requestedBy === args.discordId) {
      const recentMessages = await ctx.db.query("messages").withIndex("by_conversation_createdAt", q => q.eq("conversationId", args.conversationId)).order("desc").take(100);
      if (recentMessages.some(message => message.senderDiscordId === args.discordId && message.createdAt >= conversation.updatedAt)) {
        throw new Error("You’ve sent your introduction. Wait for the member to accept before sending another message.");
      }
    }
    const now = Date.now();
    const id = await ctx.db.insert("messages", { conversationId: args.conversationId, senderDiscordId: args.discordId, body, createdAt: now, readBy: [args.discordId] });
    await ctx.db.patch(args.conversationId, { lastMessageText: body.slice(0, 180), updatedAt: now });
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
    const messages = await ctx.db.query("messages").withIndex("by_conversation_createdAt", q => q.eq("conversationId", args.conversationId)).order("desc").take(100);
    await Promise.all(messages.filter(message => !message.readBy.includes(args.discordId)).map(message => ctx.db.patch(message._id, { readBy: [...message.readBy, args.discordId] })));
    return { success: true };
  },
});

export const blockMember = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), targetDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!args.discordId || args.discordId === args.targetDiscordId) throw new Error("Choose another member.");
    const existing = await ctx.db.query("messageBlocks").withIndex("by_pair", q => q.eq("blockerDiscordId", args.discordId)).filter(q => q.eq(q.field("blockedDiscordId"), args.targetDiscordId)).first();
    if (!existing) await ctx.db.insert("messageBlocks", { blockerDiscordId: args.discordId, blockedDiscordId: args.targetDiscordId, createdAt: Date.now() });
    return { success: true };
  },
});

export const reportMessage = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), messageId: v.id("messages"), reason: v.string(), details: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    assertParticipant(conversation, args.discordId);
    const reason = args.reason.trim().slice(0, 80);
    if (!reason) throw new Error("Choose a reason for the report.");
    const prior = await ctx.db.query("messageReports").withIndex("by_reporter_createdAt", q => q.eq("reporterDiscordId", args.discordId)).collect();
    if (prior.some(report => report.messageId === args.messageId && report.status === "open")) throw new Error("You already reported this message.");
    await ctx.db.insert("messageReports", { reporterDiscordId: args.discordId, messageId: args.messageId, conversationId: message.conversationId, reason, ...(args.details ? { details: args.details.trim().slice(0, 1000) } : {}), status: "open", createdAt: Date.now() });
    return { success: true };
  },
});

export const editMessage = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), messageId: v.id("messages"), body: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    if (message.senderDiscordId !== args.discordId) throw new Error("You can only edit your own messages.");
    if (message.deletedAt) throw new Error("Deleted messages cannot be edited.");
    const body = args.body.trim();
    if (!body || body.length > 2000) throw new Error("Messages must contain 1–2,000 characters.");
    await ctx.db.insert("messageAuditLogs", { messageId: args.messageId, conversationId: message.conversationId, actorDiscordId: args.discordId, action: "edited", previousBody: message.body, createdAt: Date.now() });
    await ctx.db.patch(args.messageId, { body, editedAt: Date.now() });
    return { success: true };
  },
});

export const deleteMessage = mutation({
  args: { adminSecret: v.string(), discordId: v.string(), messageId: v.id("messages") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    if (message.senderDiscordId !== args.discordId) throw new Error("You can only delete your own messages.");
    if (message.deletedAt) return { success: true };
    await ctx.db.insert("messageAuditLogs", { messageId: args.messageId, conversationId: message.conversationId, actorDiscordId: args.discordId, action: "deleted", previousBody: message.body, createdAt: Date.now() });
    await ctx.db.patch(args.messageId, { body: "", deletedAt: Date.now() });
    return { success: true };
  },
});
