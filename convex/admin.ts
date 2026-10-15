import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);
const contentStatusValidator = v.union(v.literal("pending"), v.literal("active"), v.literal("rejected"));

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


export const listPendingContent = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const [resources, listings, recentJobs] = await Promise.all([
      ctx.db.query("resources").withIndex("by_status_createdAt", q => q.eq("status", "pending")).order("desc").take(250),
      ctx.db.query("listings").withIndex("by_status_createdAt", q => q.eq("status", "pending")).order("desc").take(250),
      ctx.db.query("jobs").order("desc").take(250),
    ]);
    const jobs = recentJobs.filter(job => job.moderationStatus === "pending");
    // Do not return storage URLs for unreviewed files. Review metadata first; actual
    // file/image screening remains unavailable until a scanner and protected preview proxy are configured.
    return {
      resources: resources.map(({ _id, _creationTime, thumbnailStorageId, previewStorageIds, fileStorageId, ...item }) => ({ id: _id, ...item })),
      listings: listings.map(({ _id, _creationTime, imageStorageId, ...item }) => ({ id: _id, ...item })),
      jobs: jobs.map(({ _id, _creationTime, ...item }) => ({ id: _id, ...item })),
      scannerConfigured: false,
    };
  },
});

export const reviewResource = mutation({
  args: {
    adminSecret: v.string(),
    resourceId: v.id("resources"),
    status: contentStatusValidator,
    reason: v.optional(v.string()),
    reviewerDiscordId: v.string(),
    reviewerName: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("Resource submission not found.");
    const reason = args.reason?.trim();
    if (args.status === "rejected" && (!reason || reason.length < 3 || reason.length > 1000)) throw new Error("Enter a rejection reason between 3 and 1,000 characters.");
    const now = Date.now();
    await ctx.db.patch(resource._id, { status: args.status, reviewReason: args.status === "rejected" ? reason : undefined, reviewedAt: now });
    await ctx.db.insert("moderationAuditEvents", { actorDiscordId: args.reviewerDiscordId, actorName: args.reviewerName.slice(0, 100), action: "resource_" + args.status, targetType: "resource", targetId: String(resource._id), details: reason, createdAt: now });
    return { success: true, id: resource._id, status: args.status };
  },
});

export const reviewListing = mutation({
  args: {
    adminSecret: v.string(),
    listingId: v.id("listings"),
    status: contentStatusValidator,
    reason: v.optional(v.string()),
    reviewerDiscordId: v.string(),
    reviewerName: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing submission not found.");
    const reason = args.reason?.trim();
    if (args.status === "rejected" && (!reason || reason.length < 3 || reason.length > 1000)) throw new Error("Enter a rejection reason between 3 and 1,000 characters.");
    const now = Date.now();
    await ctx.db.patch(listing._id, { status: args.status, updatedAt: now });
    await ctx.db.insert("moderationAuditEvents", { actorDiscordId: args.reviewerDiscordId, actorName: args.reviewerName.slice(0, 100), action: "listing_" + args.status, targetType: "listing", targetId: String(listing._id), details: reason, createdAt: now });
    return { success: true, id: listing._id, status: args.status };
  },
});


export const reviewJob = mutation({
  args: {
    adminSecret: v.string(),
    jobId: v.id("jobs"),
    status: contentStatusValidator,
    reason: v.optional(v.string()),
    reviewerDiscordId: v.string(),
    reviewerName: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job submission not found.");
    if (job.moderationStatus !== "pending") throw new Error("This job is no longer waiting for moderation.");
    const reason = args.reason?.trim();
    if (args.status === "rejected" && (!reason || reason.length < 3 || reason.length > 1000)) throw new Error("Enter a rejection reason between 3 and 1,000 characters.");
    if (args.status === "pending") throw new Error("Choose Approve or Reject.");
    const now = Date.now();
    await ctx.db.patch(job._id, {
      moderationStatus: args.status,
      status: args.status === "active" ? "open" : "closed",
      updatedAt: now,
    });
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.reviewerDiscordId, actorName: args.reviewerName.slice(0, 100),
      action: "job_" + args.status, targetType: "job", targetId: String(job._id),
      details: reason, createdAt: now,
    });
    return { success: true, id: job._id, status: args.status };
  },
});


export const overviewCounts = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const [
      developers, studios, jobs, applications, scamReports, tickets,
      resources, listings, newApplications, supportTickets,
    ] = await Promise.all([
      ctx.db.query("developers").collect(),
      ctx.db.query("studios").collect(),
      ctx.db.query("jobs").collect(),
      ctx.db.query("applicationRecords").collect(),
      ctx.db.query("scamReports").collect(),
      ctx.db.query("supportTickets").collect(),
      ctx.db.query("resources").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("applicationRecords").collect(),
      ctx.db.query("supportTickets").collect(),
    ]);
    const knownIds = new Set<string>();
    for (const row of developers) knownIds.add(row.discordId);
    for (const row of studios) knownIds.add(row.ownerDiscordId);
    for (const row of jobs) knownIds.add(row.posterDiscordId);
    for (const row of applications) knownIds.add(row.applicantDiscordId);
    for (const row of tickets) knownIds.add(row.ownerDiscordId);
    for (const row of scamReports) knownIds.add(row.reporterDiscordId);
    const pendingApplications = newApplications.filter(row => ["Submitted", "Under Review", "Changes Requested", "Escalated"].includes(row.status)).length;
    const openSupport = supportTickets.filter(row => ["Open", "In Review", "Waiting on User", "Escalated"].includes(row.status)).length;
    const pendingContent = resources.filter(row => row.status === "pending").length
      + listings.filter(row => row.status === "pending").length
      + jobs.filter(row => row.moderationStatus === "pending").length;
    const pendingDeveloperProfiles = developers.filter(row => row.status === "pending").length;
    return {
      stats: {
        users: knownIds.size,
        developers: developers.filter(row => row.status === "approved").length,
        studios: studios.filter(row => row.status === "active").length,
        jobs: jobs.filter(row => row.status === "open" && row.moderationStatus !== "pending" && row.moderationStatus !== "rejected").length,
        applications: applications.length,
        reports: scamReports.length,
        pending: pendingApplications + pendingContent + pendingDeveloperProfiles,
        support: openSupport,
      },
      definitions: {
        users: "Distinct Discord IDs found in creator, studio, job, application, support, and report records; not a total of all Discord sign-ins.",
        developers: "Approved developer profiles",
        studios: "Active studios",
        jobs: "Open jobs visible on the public board (legacy records without a moderation status remain visible)",
        applications: "All persisted application records, including drafts and withdrawn applications",
        reports: "All persisted scam/safety reports",
        pending: "Submitted/review/changes-requested/escalated applications plus pending resource, listing, job, and developer-profile records",
        support: "Support tickets not yet resolved or closed",
      },
      generatedAt: Date.now(),
    };
  },
});

