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
    const [developers, listings, resources, jobs, scamReports, developerReports, tickets, communityApplications] = await Promise.all([
      ctx.db.query("developers").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("resources").collect(),
      ctx.db.query("jobs").collect(),
      ctx.db.query("scamReports").collect(),
      ctx.db.query("developerReports").collect(),
      ctx.db.query("supportTickets").collect(),
      ctx.db.query("platformApplications").collect(),
    ]);
    const pendingDevelopers = developers.filter(x => x.status === "pending").length;
    const pendingCommunityApplications = communityApplications.filter(x => x.status === "pending").length;
    const pendingResources = resources.filter(x => x.status === "pending").length;
    const openTickets = tickets.filter(x => ["open", "in_review", "waiting_on_user", "escalated"].includes(x.status)).length;
    return {
      stats: {
        developers: developers.filter(x => x.status === "approved").length,
        listings: listings.length,
        resources: resources.length,
        jobs: jobs.length,
        applications: developers.length + communityApplications.length,
        reports: scamReports.length + developerReports.length,
        pending: pendingDevelopers + pendingResources + pendingCommunityApplications,
        support: openTickets,
      },
      moderation: {
        pendingResources: pendingResources,
        pendingDevelopers,
        pendingCommunityApplications,
        openTickets,
      },
      generatedAt: Date.now(),
    };
  },
});

const platformApplicationType = v.union(v.literal("Studio Registration"), v.literal("Posting Access"), v.literal("Content Creator"), v.literal("Staff Application"), v.literal("Hiring Access"));
const applicationStatus = v.union(v.literal("pending"), v.literal("in_review"), v.literal("approved"), v.literal("rejected"));
const restrictionType = v.union(v.literal("warning"), v.literal("restricted"), v.literal("temporary_ban"), v.literal("permanent_ban"), v.literal("upload_ban"), v.literal("posting_ban"));

export const listPlatformApplications = query({
  args: { adminSecret: v.string(), statusFilter: v.optional(applicationStatus), typeFilter: v.optional(platformApplicationType) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = args.statusFilter
      ? await ctx.db.query("platformApplications").withIndex("by_status_createdAt", q => q.eq("status", args.statusFilter!)).order("desc").take(500)
      : await ctx.db.query("platformApplications").order("desc").take(500);
    const filtered = args.typeFilter ? rows.filter(x => x.applicationType === args.typeFilter) : rows;
    return { applications: filtered, total: filtered.length, generatedAt: Date.now() };
  }
});

export const reviewPlatformApplication = mutation({
  args: { adminSecret: v.string(), applicationId: v.id("platformApplications"), status: applicationStatus, reason: v.optional(v.string()), actorDiscordId: v.string(), actorName: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found.");
    if (args.status === "rejected" && (!args.reason?.trim() || args.reason.trim().length > 1000)) throw new Error("Enter a rejection reason.");
    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: args.status, decisionReason: args.status === "rejected" ? args.reason!.trim() : args.reason?.trim().slice(0, 1000) || undefined,
      reviewedBy: args.actorDiscordId, reviewedByName: args.actorName.slice(0, 100), reviewedAt: now, updatedAt: now,
    });
    await ctx.db.insert("adminAuditLogs", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: "application_" + args.status, entityType: "application", entityId: args.applicationId,
      reason: args.reason?.trim().slice(0, 1000) || undefined, createdAt: now,
    });
    return { success: true, applicationId: args.applicationId, status: args.status };
  }
});

export const listUserRestrictions = query({
  args: { adminSecret: v.string(), targetDiscordId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    const rows = args.targetDiscordId
      ? await ctx.db.query("userRestrictions").withIndex("by_target_status", q => q.eq("targetDiscordId", args.targetDiscordId!).eq("status", "active")).order("desc").take(250)
      : await ctx.db.query("userRestrictions").withIndex("by_status_createdAt", q => q.eq("status", "active")).order("desc").take(500);
    return rows.filter(r => r.expiresAt === undefined || r.expiresAt > now);
  }
});

export const getActiveRestrictionsForUser = query({
  args: { adminSecret: v.string(), targetDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    const rows = await ctx.db.query("userRestrictions").withIndex("by_target_status", q => q.eq("targetDiscordId", args.targetDiscordId).eq("status", "active")).collect();
    return rows.filter(r => r.expiresAt === undefined || r.expiresAt > now);
  }
});

export const createUserRestriction = mutation({
  args: {
    adminSecret: v.string(), targetDiscordId: v.string(), targetDisplayName: v.string(), restrictionType,
    reason: v.string(), expiresAt: v.optional(v.number()), actorDiscordId: v.string(), actorName: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!/^\d{5,25}$/.test(args.targetDiscordId)) throw new Error("Enter a valid Discord user ID.");
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 1000) throw new Error("A reason between 3 and 1,000 characters is required.");
    if (args.targetDiscordId === args.actorDiscordId) throw new Error("You cannot restrict your own administrator account.");
    if (args.restrictionType === "temporary_ban" && (!args.expiresAt || args.expiresAt <= Date.now())) throw new Error("A temporary restriction must have a future expiry.");
    if (args.expiresAt !== undefined && args.expiresAt <= Date.now()) throw new Error("Expiry must be in the future.");
    const now = Date.now();
    const id = await ctx.db.insert("userRestrictions", {
      targetDiscordId: args.targetDiscordId, targetDisplayName: args.targetDisplayName.slice(0, 100),
      restrictionType: args.restrictionType, reason, status: "active", expiresAt: args.expiresAt,
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100), createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("adminAuditLogs", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: "restriction_created", entityType: "userRestriction", entityId: id,
      reason, createdAt: now,
    });
    return { success: true, restrictionId: id };
  }
});

export const revokeUserRestriction = mutation({
  args: { adminSecret: v.string(), restrictionId: v.id("userRestrictions"), actorDiscordId: v.string(), actorName: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const current = await ctx.db.get(args.restrictionId);
    if (!current) throw new Error("Restriction not found.");
    if (current.status === "revoked") return { success: true, restrictionId: args.restrictionId };
    const now = Date.now();
    await ctx.db.patch(args.restrictionId, { status: "revoked", updatedAt: now, revokedAt: now, revokedBy: args.actorDiscordId });
    await ctx.db.insert("adminAuditLogs", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: "restriction_revoked", entityType: "userRestriction", entityId: args.restrictionId,
      reason: args.reason?.trim().slice(0, 1000) || undefined, createdAt: now,
    });
    return { success: true, restrictionId: args.restrictionId };
  }
});

export const getDeveloperProfileForUser = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!/^\\d{5,25}$/.test(args.discordId)) throw new Error("Invalid Discord identity.");
    return await ctx.db.query("developers").withIndex("by_discord", q => q.eq("discordId", args.discordId)).collect();
  },
});
