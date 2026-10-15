import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized support service request.");
}

const category = v.union(v.literal("Account Appeal"), v.literal("Report a Scammer"), v.literal("Report Content"), v.literal("Technical Support"), v.literal("Studio Request"), v.literal("General Support"));
const status = v.union(v.literal("open"), v.literal("in_review"), v.literal("waiting_on_user"), v.literal("escalated"), v.literal("resolved"), v.literal("closed"));
const priority = v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"));

export const createTicket = mutation({
  args: { adminSecret: v.string(), category, subject: v.string(), reference: v.optional(v.string()), department: v.optional(v.string()), actionTaken: v.optional(v.string()), description: v.string(), applicantDiscordId: v.string(), applicantName: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const subject = args.subject.trim(), description = args.description.trim();
    if (subject.length < 2 || subject.length > 120) throw new Error("Subject must be 2–120 characters.");
    if (description.length < 20 || description.length > 5000) throw new Error("Description must be 20–5,000 characters.");
    if (!/^\d{5,25}$/.test(args.applicantDiscordId)) throw new Error("A verified Discord identity is required.");
    const now = Date.now();
    const ticketNumber = `SP-${now.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const ticketId = await ctx.db.insert("supportTickets", { ticketNumber, category: args.category, subject, reference: args.reference?.trim() || undefined, department: args.department, actionTaken: args.actionTaken, description, applicantDiscordId: args.applicantDiscordId, applicantName: args.applicantName.slice(0, 100), status: "open", priority: "normal", createdAt: now, updatedAt: now, lastMessageAt: now });
    await ctx.db.insert("supportMessages", { ticketId, authorDiscordId: args.applicantDiscordId, authorName: args.applicantName.slice(0, 100), body: description, visibility: "public", createdAt: now });
    await ctx.db.insert("supportAuditLogs", { ticketId, actorDiscordId: args.applicantDiscordId, actorName: args.applicantName.slice(0, 100), action: "ticket_created", createdAt: now });
    return { ticketId, ticketNumber };
  },
});

export const listTickets = query({
  args: { adminSecret: v.string(), statusFilter: v.optional(status), categoryFilter: v.optional(category), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 100), 200));
    const rows = args.statusFilter
      ? await ctx.db.query("supportTickets").withIndex("by_status_updatedAt", q => q.eq("status", args.statusFilter!)).order("desc").take(limit)
      : await ctx.db.query("supportTickets").order("desc").take(limit);
    const filtered = args.categoryFilter ? rows.filter(t => t.category === args.categoryFilter) : rows;
    return { tickets: filtered, counts: {
      open: filtered.filter(t => t.status === "open").length,
      in_review: filtered.filter(t => t.status === "in_review").length,
      waiting_on_user: filtered.filter(t => t.status === "waiting_on_user").length,
      escalated: filtered.filter(t => t.status === "escalated").length,
      resolved: filtered.filter(t => t.status === "resolved").length,
      closed: filtered.filter(t => t.status === "closed").length,
    }};
  },
});

export const listMyTickets = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    return await ctx.db.query("supportTickets").withIndex("by_applicant_createdAt", q => q.eq("applicantDiscordId", args.applicantDiscordId)).order("desc").take(100);
  },
});

export const getTicket = query({
  args: { adminSecret: v.string(), ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;
    const messages = await ctx.db.query("supportMessages").withIndex("by_ticket_createdAt", q => q.eq("ticketId", args.ticketId)).order("asc").take(300);
    const audit = await ctx.db.query("supportAuditLogs").withIndex("by_ticket_createdAt", q => q.eq("ticketId", args.ticketId)).order("desc").take(100);
    return { ticket, messages, audit };
  },
});

export const addMessage = mutation({
  args: { adminSecret: v.string(), ticketId: v.id("supportTickets"), authorDiscordId: v.string(), authorName: v.string(), body: v.string(), visibility: v.union(v.literal("public"), v.literal("internal")) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    const body = args.body.trim();
    if (body.length < 1 || body.length > 5000) throw new Error("Message must be 1–5,000 characters.");
    if (args.visibility === "public" && ticket.status === "closed") throw new Error("Reopen the ticket before replying.");
    const now = Date.now();
    await ctx.db.insert("supportMessages", { ticketId: args.ticketId, authorDiscordId: args.authorDiscordId, authorName: args.authorName.slice(0, 100), body, visibility: args.visibility, createdAt: now });
    await ctx.db.patch(args.ticketId, { updatedAt: now, lastMessageAt: now, ...(args.visibility === "public" && args.authorDiscordId === ticket.applicantDiscordId ? { status: "open" as const } : {}) });
    await ctx.db.insert("supportAuditLogs", { ticketId: args.ticketId, actorDiscordId: args.authorDiscordId, actorName: args.authorName.slice(0, 100), action: args.visibility === "internal" ? "internal_note_added" : "message_added", createdAt: now });
    return { success: true };
  },
});

export const updateTicket = mutation({
  args: { adminSecret: v.string(), ticketId: v.id("supportTickets"), actorDiscordId: v.string(), actorName: v.string(), status, priority: v.optional(priority), assignedTo: v.optional(v.string()), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    const now = Date.now();
    await ctx.db.patch(args.ticketId, { status: args.status, priority: args.priority ?? ticket.priority, assignedTo: args.assignedTo?.trim() || undefined, updatedAt: now, ...(args.status === "resolved" ? { resolvedAt: now } : {}), ...(args.status === "closed" ? { closedAt: now } : {}) });
    await ctx.db.insert("supportAuditLogs", { ticketId: args.ticketId, actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), action: "ticket_updated:" + args.status, reason: args.reason?.trim().slice(0, 1000) || undefined, createdAt: now });
    return { success: true };
  },
});
