import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized admin request.");
  }
}

/**
 * Server-to-server admin query. The shared secret is only read by protected
 * Next.js API routes and must never be sent to the browser.
 */
export const listDeveloperApplications = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const statuses = ["pending", "approved", "rejected"] as const;
    const groups = await Promise.all(
      statuses.map((status) =>
        ctx.db
          .query("developers")
          .withIndex("by_status_createdAt", (q) => q.eq("status", status))
          .order("desc")
          .take(200)
      )
    );

    const applications = groups
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      applications,
      counts: {
        pending: groups[0].length,
        approved: groups[1].length,
        rejected: groups[2].length,
      },
      limitPerStatus: 200,
    };
  },
});

export const reviewDeveloperApplication = mutation({
  args: {
    adminSecret: v.string(),
    developerId: v.id("developers"),
    status: statusValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const developer = await ctx.db.get(args.developerId);
    if (!developer) throw new Error("Developer application not found.");

    const reason = args.reason?.trim();
    if (args.status === "rejected" && (!reason || reason.length < 3 || reason.length > 1000)) {
      throw new Error("Enter a rejection reason between 3 and 1,000 characters.");
    }

    await ctx.db.patch(args.developerId, {
      status: args.status,
      reviewReason: args.status === "rejected" ? reason : undefined,
      updatedAt: Date.now(),
    });

    return { success: true, developerId: args.developerId, status: args.status };
  },
});


export const listResourceSubmissions = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const statuses = ["pending", "active", "rejected"] as const;
    const groups = await Promise.all(statuses.map((s) =>
      ctx.db.query("resources").withIndex("by_status_createdAt", (q) => q.eq("status", s)).order("desc").take(250)
    ));
    return {
      resources: await Promise.all(groups.flat().sort((a, b) => b.createdAt - a.createdAt).map(async (item) => ({
        ...item,
        thumbnailUrl: await ctx.storage.getUrl(item.thumbnailStorageId),
      }))),
      counts: { pending: groups[0].length, active: groups[1].length, rejected: groups[2].length },
      limitPerStatus: 250,
    };
  },
});

export const reviewResourceSubmission = mutation({
  args: {
    adminSecret: v.string(), resourceId: v.id("resources"),
    status: v.union(v.literal("active"), v.literal("rejected")),
    reason: v.optional(v.string()), actorDiscordId: v.string(), actorName: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("Resource submission not found.");
    if (args.status === "rejected" && (!args.reason?.trim() || args.reason.trim().length > 1000)) {
      throw new Error("Enter a rejection reason between 1 and 1,000 characters.");
    }
    const now = Date.now();
    await ctx.db.patch(args.resourceId, {
      status: args.status, reviewedAt: now,
      reviewReason: args.status === "rejected" ? args.reason!.trim() : undefined,
    });
    await ctx.db.insert("adminAuditLogs", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: args.status === "active" ? "resource_approved" : "resource_rejected",
      entityType: "resource", entityId: args.resourceId,
      reason: args.reason?.trim().slice(0, 1000) || undefined, createdAt: now,
    });
    return { success: true, resourceId: args.resourceId, status: args.status };
  },
});

export const getPlatformOverview = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const [developers, listings, resources, jobs, scamReports, developerReports, tickets] = await Promise.all([
      ctx.db.query("developers").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("resources").collect(),
      ctx.db.query("jobs").collect(),
      ctx.db.query("scamReports").collect(),
      ctx.db.query("developerReports").collect(),
      ctx.db.query("supportTickets").collect(),
    ]);
    const pendingDevelopers = developers.filter(x => x.status === "pending").length;
    const pendingResources = resources.filter(x => x.status === "pending").length;
    const openTickets = tickets.filter(x => ["open", "in_review", "waiting_on_user", "escalated"].includes(x.status)).length;
    return {
      stats: {
        developers: developers.filter(x => x.status === "approved").length,
        listings: listings.length,
        resources: resources.length,
        jobs: jobs.length,
        applications: developers.length,
        reports: scamReports.length + developerReports.length,
        pending: pendingDevelopers + pendingResources,
        support: openTickets,
      },
      moderation: {
        pendingResources: pendingResources,
        pendingDevelopers,
        openTickets,
      },
      generatedAt: Date.now(),
    };
  },
});
