import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized support service request.");
  }
}

const category = v.union(
  v.literal("Account Appeal"), v.literal("Report a Scammer"), v.literal("Report Content"),
  v.literal("Technical Support"), v.literal("Studio Request"), v.literal("General Support")
);
const status = v.union(
  v.literal("open"), v.literal("in_review"), v.literal("waiting_on_user"),
  v.literal("escalated"), v.literal("resolved"), v.literal("closed")
);
const priority = v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"));

export const createTicket = mutation({
  args: {
    adminSecret: v.string(), category, subject: v.string(), reference: v.optional(v.string()),
    department: v.optional(v.string()), actionTaken: v.optional(v.string()), description: v.string(),
    attachments: v.optional(v.array(v.string())), applicantDiscordId: v.string(), applicantName: v.string()
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const subject = args.subject.trim();
    const description = args.description.trim();
    if (subject.length < 2 || subject.length > 120) throw new Error("Subject must be 2–120 characters.");
    if (description.length < 20 || description.length > 5000) throw new Error("Description must be 20–5,000 characters.");
    if (!/^\d{5,25}$/.test(args.applicantDiscordId)) throw new Error("A verified Discord identity is required.");
    if (args.category === "Account Appeal" && (!args.department?.trim() || !args.actionTaken?.trim())) {
      throw new Error("Choose the department and action being appealed.");
    }
    const now = Date.now();
    const ticketNumber = `SP-${now.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const ticketId = await ctx.db.insert("supportTickets", {
      ticketNumber, category: args.category, subject,
      reference: args.reference?.trim().slice(0, 500) || undefined,
      department: args.department?.trim().slice(0, 100) || undefined,
      actionTaken: args.actionTaken?.trim().slice(0, 200) || undefined,
      description, attachments: args.attachments?.slice(0, 3), applicantDiscordId: args.applicantDiscordId,
      applicantName: args.applicantName.trim().slice(0, 100) || "Discord member",
      status: "open", priority: "normal", createdAt: now, updatedAt: now, lastMessageAt: now
    });
    await ctx.db.insert("supportMessages", {
      ticketId, authorDiscordId: args.applicantDiscordId,
      authorName: args.applicantName.trim().slice(0, 100) || "Discord member",
      body: description, attachments: args.attachments?.slice(0, 3), visibility: "public", createdAt: now
    });
    await ctx.db.insert("supportAuditLogs", {
      ticketId, actorDiscordId: args.applicantDiscordId,
      actorName: args.applicantName.trim().slice(0, 100) || "Discord member",
      action: "ticket_created", createdAt: now
    });
    return { ticketId, ticketNumber };
  }
});

export const listTickets = query({
  args: { adminSecret: v.string(), statusFilter: v.optional(status), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const statuses = ["open", "in_review", "waiting_on_user", "escalated", "resolved", "closed"] as const;
    const groups = await Promise.all(statuses.map((s) =>
      ctx.db.query("supportTickets").withIndex("by_status_updatedAt", q => q.eq("status", s)).order("desc").collect()
    ));
    const all = groups.flat().sort((a, b) => b.updatedAt - a.updatedAt);
    const counts = Object.fromEntries(statuses.map((s, i) => [s, groups[i].length]));
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 200), 500));
    const filtered = args.statusFilter ? all.filter(t => t.status === args.statusFilter) : all;
    return { tickets: filtered.slice(0, limit), counts, total: filtered.length };
  }
});

export const listMyTickets = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!/^\d{5,25}$/.test(args.applicantDiscordId)) throw new Error("A verified Discord identity is required.");
    return await ctx.db.query("supportTickets")
      .withIndex("by_applicant_createdAt", q => q.eq("applicantDiscordId", args.applicantDiscordId))
      .order("desc").take(100);
  }
});

export const getTicket = query({
  args: { adminSecret: v.string(), ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;
    const messages = await ctx.db.query("supportMessages")
      .withIndex("by_ticket_createdAt", q => q.eq("ticketId", args.ticketId)).order("asc").take(300);
    const audit = await ctx.db.query("supportAuditLogs")
      .withIndex("by_ticket_createdAt", q => q.eq("ticketId", args.ticketId)).order("desc").take(100);
    return { ticket, messages, audit };
  }
});

export const addMessage = mutation({
  args: {
    adminSecret: v.string(), ticketId: v.id("supportTickets"), authorDiscordId: v.string(),
    authorName: v.string(), body: v.string(), attachments: v.optional(v.array(v.string())), visibility: v.union(v.literal("public"), v.literal("internal"))
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    const body = args.body.trim();
    if (!body || body.length > 5000) throw new Error("Message must be 1–5,000 characters.");
    if (args.visibility === "public" && ticket.status === "closed") throw new Error("Reopen the ticket before replying.");
    const now = Date.now();
    const authorName = args.authorName.trim().slice(0, 100) || "Spider support";
    await ctx.db.insert("supportMessages", {
      ticketId: args.ticketId, authorDiscordId: args.authorDiscordId, authorName,
      body, attachments: args.attachments?.slice(0, 3), visibility: args.visibility, createdAt: now
    });
    const isApplicant = args.authorDiscordId === ticket.applicantDiscordId;
    await ctx.db.patch(args.ticketId, {
      updatedAt: now, lastMessageAt: now,
      ...(args.visibility === "public" ? { status: (isApplicant ? "open" : "waiting_on_user") as typeof ticket.status } : {})
    });
    await ctx.db.insert("supportAuditLogs", {
      ticketId: args.ticketId, actorDiscordId: args.authorDiscordId, actorName: authorName,
      action: args.visibility === "internal" ? "internal_note_added" : "message_added", createdAt: now
    });
    return { success: true };
  }
});

export const updateTicket = mutation({
  args: {
    adminSecret: v.string(), ticketId: v.id("supportTickets"), actorDiscordId: v.string(),
    actorName: v.string(), status, priority: v.optional(priority),
    assignedTo: v.optional(v.string()), reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: args.status, priority: args.priority ?? ticket.priority,
      ...(args.assignedTo !== undefined ? { assignedTo: args.assignedTo.trim().slice(0, 100) || undefined } : {}),
      updatedAt: now,
      ...(args.status === "resolved" ? { resolvedAt: now } : {}),
      ...(args.status === "closed" ? { closedAt: now } : {})
    });
    await ctx.db.insert("supportAuditLogs", {
      ticketId: args.ticketId, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: "ticket_updated:" + args.status, reason: args.reason?.trim().slice(0, 1000) || undefined, createdAt: now
    });
    return { success: true };
  }
});
