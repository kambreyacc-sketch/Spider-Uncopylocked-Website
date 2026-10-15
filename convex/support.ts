import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const category = v.union(
  v.literal("Account Appeal"),
  v.literal("Report a Scammer"),
  v.literal("Report Content"),
  v.literal("Technical Support"),
  v.literal("Studio Request"),
  v.literal("General Support"),
);
const status = v.union(
  v.literal("Open"),
  v.literal("In Review"),
  v.literal("Waiting on User"),
  v.literal("Escalated"),
  v.literal("Resolved"),
  v.literal("Closed"),
);
const priority = v.union(v.literal("Low"), v.literal("Normal"), v.literal("High"), v.literal("Urgent"));

function assertServiceSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized support service request.");
  }
}

async function nextTicketNumber(ctx: any) {
  const row = await ctx.db.query("supportCounters").withIndex("by_name", (q: any) => q.eq("name", "tickets")).unique();
  if (!row) {
    await ctx.db.insert("supportCounters", { name: "tickets", value: 1000 });
    return 1001;
  }
  const value = row.value + 1;
  await ctx.db.patch(row._id, { value });
  return value;
}

export const createTicket = mutation({
  args: {
    adminSecret: v.string(),
    ownerDiscordId: v.string(),
    ownerName: v.string(),
    ownerAvatar: v.optional(v.string()),
    category,
    subject: v.string(),
    description: v.string(),
    department: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
    infractionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const subject = args.subject.trim();
    const description = args.description.trim();
    const now = Date.now();
    if (!args.ownerDiscordId.trim()) throw new Error("Sign in before opening a ticket.");
    if (subject.length < 4 || subject.length > 120) throw new Error("Subject must be 4–120 characters.");
    if (description.length < 20 || description.length > 8000) throw new Error("Description must be 20–8,000 characters.");
    if (args.category === "Account Appeal") {
      if (!args.department?.trim()) throw new Error("Select the department or area your appeal concerns.");
      if (!args.actionTaken?.trim()) throw new Error("Select the action taken against you.");
      if (args.department.length > 120 || args.actionTaken.length > 160) throw new Error("Appeal fields are too long.");
      if (args.infractionId && args.infractionId.length > 100) throw new Error("Infraction ID is too long.");
    }
    const recent = await ctx.db.query("supportTickets")
      .withIndex("by_owner_updatedAt", (q: any) => q.eq("ownerDiscordId", args.ownerDiscordId))
      .order("desc").take(8);
    if (recent.filter((t: any) => now - t.createdAt < 15 * 60 * 1000).length >= 5) {
      throw new Error("Too many tickets submitted recently. Please wait before trying again.");
    }
    const duplicate = recent.find((t: any) =>
      t.subject.toLowerCase() === subject.toLowerCase() &&
      t.category === args.category &&
      t.status !== "Closed" &&
      t.status !== "Resolved" &&
      now - t.createdAt < 12 * 60 * 60 * 1000
    );
    if (duplicate) throw new Error("You already have an open ticket with this subject.");
    const ticketNumber = await nextTicketNumber(ctx);
    const ticketId = await ctx.db.insert("supportTickets", {
      ticketNumber,
      category: args.category,
      subject,
      description,
      ownerDiscordId: args.ownerDiscordId,
      ownerName: args.ownerName.trim().slice(0, 100),
      ...(args.ownerAvatar ? { ownerAvatar: args.ownerAvatar } : {}),
      ...(args.department?.trim() ? { department: args.department.trim() } : {}),
      ...(args.actionTaken?.trim() ? { actionTaken: args.actionTaken.trim() } : {}),
      ...(args.infractionId?.trim() ? { infractionId: args.infractionId.trim() } : {}),
      status: "Open",
      priority: "Normal",
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
    await ctx.db.insert("supportMessages", {
      ticketId,
      authorDiscordId: args.ownerDiscordId,
      authorName: args.ownerName.trim().slice(0, 100),
      ...(args.ownerAvatar ? { authorAvatar: args.ownerAvatar } : {}),
      body: description,
      visibility: "public",
      kind: "reply",
      createdAt: now,
    });
    await ctx.db.insert("supportAuditEvents", {
      ticketId, ticketNumber, actorDiscordId: args.ownerDiscordId,
      actorName: args.ownerName.trim().slice(0, 100), action: "ticket_created",
      details: args.category, createdAt: now,
    });
    return { success: true, ticketNumber };
  },
});

export const listMine = query({
  args: { adminSecret: v.string(), ownerDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    return await ctx.db.query("supportTickets")
      .withIndex("by_owner_updatedAt", (q: any) => q.eq("ownerDiscordId", args.ownerDiscordId))
      .order("desc").take(100);
  },
});

export const getMine = query({
  args: { adminSecret: v.string(), ownerDiscordId: v.string(), ticketNumber: v.number() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const ticket = await ctx.db.query("supportTickets")
      .withIndex("by_ticketNumber", (q: any) => q.eq("ticketNumber", args.ticketNumber)).unique();
    if (!ticket || ticket.ownerDiscordId !== args.ownerDiscordId) return null;
    const messages = await ctx.db.query("supportMessages")
      .withIndex("by_ticket_createdAt", (q: any) => q.eq("ticketId", ticket._id))
      .order("asc").collect();
    const events = await ctx.db.query("supportAuditEvents")
      .withIndex("by_ticket_createdAt", (q: any) => q.eq("ticketId", ticket._id))
      .order("asc").collect();
    return {
      ticket,
      messages: messages.filter((m: any) => m.visibility === "public"),
      events: events.filter((e: any) => e.action === "status_changed" || e.action === "ticket_created")
        .map((e: any) => ({ action: e.action, details: e.details, createdAt: e.createdAt })),
    };
  },
});

export const listForStaff = query({
  args: { adminSecret: v.string(), status: v.optional(status) },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    if (args.status) {
      return await ctx.db.query("supportTickets")
        .withIndex("by_status_lastActivityAt", (q: any) => q.eq("status", args.status))
        .order("desc").take(250);
    }
    return await ctx.db.query("supportTickets").order("desc").take(250);
  },
});

export const getForStaff = query({
  args: { adminSecret: v.string(), ticketNumber: v.number() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const ticket = await ctx.db.query("supportTickets")
      .withIndex("by_ticketNumber", (q: any) => q.eq("ticketNumber", args.ticketNumber)).unique();
    if (!ticket) return null;
    const messages = await ctx.db.query("supportMessages")
      .withIndex("by_ticket_createdAt", (q: any) => q.eq("ticketId", ticket._id))
      .order("asc").collect();
    const events = await ctx.db.query("supportAuditEvents")
      .withIndex("by_ticket_createdAt", (q: any) => q.eq("ticketId", ticket._id))
      .order("asc").collect();
    return { ticket, messages, events };
  },
});

export const replyAsMember = mutation({
  args: { adminSecret: v.string(), ticketNumber: v.number(), ownerDiscordId: v.string(), ownerName: v.string(), ownerAvatar: v.optional(v.string()), body: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const ticket = await ctx.db.query("supportTickets").withIndex("by_ticketNumber", (q: any) => q.eq("ticketNumber", args.ticketNumber)).unique();
    if (!ticket || ticket.ownerDiscordId !== args.ownerDiscordId) throw new Error("Ticket not found.");
    if (ticket.status === "Closed") throw new Error("This ticket is closed. Contact support to request reopening.");
    const body = args.body.trim();
    if (body.length < 1 || body.length > 8000) throw new Error("Reply must be 1–8,000 characters.");
    const now = Date.now();
    await ctx.db.insert("supportMessages", { ticketId: ticket._id, authorDiscordId: args.ownerDiscordId, authorName: args.ownerName.slice(0, 100), ...(args.ownerAvatar ? { authorAvatar: args.ownerAvatar } : {}), body, visibility: "public", kind: "reply", createdAt: now });
    const nextStatus = ticket.status === "Resolved" ? "Open" : ticket.status;
    await ctx.db.patch(ticket._id, { status: nextStatus, updatedAt: now, lastActivityAt: now, closedAt: undefined });
    await ctx.db.insert("supportAuditEvents", { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, actorDiscordId: args.ownerDiscordId, actorName: args.ownerName.slice(0, 100), action: "member_reply", details: nextStatus !== ticket.status ? "Ticket reopened by member reply" : undefined, createdAt: now });
    return { success: true, status: nextStatus };
  },
});

export const staffUpdate = mutation({
  args: {
    adminSecret: v.string(),
    ticketNumber: v.number(),
    actorDiscordId: v.string(),
    actorName: v.string(),
    status: v.optional(status),
    priority: v.optional(priority),
    assignedToDiscordId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    reply: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("internal"))),
  },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const ticket = await ctx.db.query("supportTickets").withIndex("by_ticketNumber", (q: any) => q.eq("ticketNumber", args.ticketNumber)).unique();
    if (!ticket) throw new Error("Ticket not found.");
    const reply = args.reply?.trim();
    if (reply && (reply.length < 1 || reply.length > 8000)) throw new Error("Message must be 1–8,000 characters.");
    if (args.status === "Closed" && ticket.status !== "Closed" && !args.reply && !args.visibility) {
      // Closing without a reply is permitted, but remains audit logged below.
    }
    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now, lastActivityAt: now };
    if (args.status) {
      patch.status = args.status;
      patch.closedAt = args.status === "Closed" ? now : undefined;
      if (args.status !== ticket.status) {
        await ctx.db.insert("supportAuditEvents", { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), action: "status_changed", details: ticket.status + " → " + args.status, createdAt: now });
      }
    }
    if (args.priority) patch.priority = args.priority;
    if (args.assignedToDiscordId !== undefined) {
      if (args.assignedToDiscordId.trim()) {
        patch.assignedToDiscordId = args.assignedToDiscordId.trim();
        patch.assignedToName = (args.assignedToName || args.assignedToDiscordId).slice(0, 100);
      } else {
        patch.assignedToDiscordId = undefined;
        patch.assignedToName = undefined;
      }
    }
    await ctx.db.patch(ticket._id, patch);
    if (args.priority && args.priority !== ticket.priority) {
      await ctx.db.insert("supportAuditEvents", { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), action: "priority_changed", details: ticket.priority + " → " + args.priority, createdAt: now });
    }
    if (args.assignedToDiscordId !== undefined && args.assignedToDiscordId !== ticket.assignedToDiscordId) {
      await ctx.db.insert("supportAuditEvents", { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), action: "assignment_changed", details: args.assignedToDiscordId || "Unassigned", createdAt: now });
    }
    if (reply) {
      const visibility = args.visibility || "public";
      await ctx.db.insert("supportMessages", { ticketId: ticket._id, authorDiscordId: args.actorDiscordId, authorName: args.actorName.slice(0, 100), body: reply, visibility, kind: visibility === "internal" ? "internal_note" : "reply", createdAt: now });
      await ctx.db.insert("supportAuditEvents", { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), action: visibility === "internal" ? "internal_note_added" : "staff_reply", createdAt: now });
    }
    return { success: true };
  },
});
