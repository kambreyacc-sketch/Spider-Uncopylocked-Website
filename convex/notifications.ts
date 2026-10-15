import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertServiceSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized notification service request.");
  }
}

export const listMine = query({
  args: { adminSecret: v.string(), recipientDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const notifications = await ctx.db.query("userNotifications")
      .withIndex("by_recipient_createdAt", q => q.eq("recipientDiscordId", args.recipientDiscordId))
      .order("desc").take(100);
    return {
      notifications,
      unreadCount: notifications.filter(item => item.readAt === undefined).length,
    };
  },
});

export const markRead = mutation({
  args: { adminSecret: v.string(), notificationId: v.id("userNotifications"), recipientDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.recipientDiscordId !== args.recipientDiscordId) {
      throw new Error("Notification not found.");
    }
    if (notification.readAt === undefined) {
      await ctx.db.patch(notification._id, { readAt: Date.now() });
    }
    return { success: true };
  },
});

export const markAllRead = mutation({
  args: { adminSecret: v.string(), recipientDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const notifications = await ctx.db.query("userNotifications")
      .withIndex("by_recipient_createdAt", q => q.eq("recipientDiscordId", args.recipientDiscordId))
      .order("desc").take(200);
    const unread = notifications.filter(item => item.readAt === undefined);
    const now = Date.now();
    for (const notification of unread) await ctx.db.patch(notification._id, { readAt: now });
    return { success: true, markedRead: unread.length };
  },
});
