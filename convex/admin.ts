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



const operationSection = v.union(
  v.literal("users"), v.literal("studios"), v.literal("jobs"),
  v.literal("restrictions"), v.literal("activity"), v.literal("settings")
);

/** Owner/service-only operational list. Every row is derived from persistent records. */
export const listOperations = query({
  args: {
    adminSecret: v.string(),
    section: operationSection,
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const term = (args.search || "").trim().toLowerCase().slice(0, 120);
    const page = Number.isSafeInteger(args.page) && (args.page || 0) > 0 ? args.page! : 1;
    const pageSize = Number.isSafeInteger(args.pageSize) ? Math.max(10, Math.min(50, args.pageSize!)) : 25;
    const matches = (values: unknown[]) => !term || values.some(value => String(value ?? "").toLowerCase().includes(term));
    let rows: any[] = [];

    if (args.section === "users") {
      const [developers, studios, jobs, applications, tickets, reports, grants, restrictions] = await Promise.all([
        ctx.db.query("developers").order("desc").take(500),
        ctx.db.query("studios").order("desc").take(500),
        ctx.db.query("jobs").order("desc").take(500),
        ctx.db.query("applicationRecords").order("desc").take(500),
        ctx.db.query("supportTickets").order("desc").take(500),
        ctx.db.query("scamReports").order("desc").take(500),
        ctx.db.query("websiteRoleGrants").order("desc").take(500),
        ctx.db.query("accountRestrictions").order("desc").take(500),
      ]);
      const byId = new Map<string, { discordId: string; name: string; lastSeenAt: number; sources: Set<string>; developerStatus?: string; restrictionCount: number; activeRoles: Set<string> }>();
      const touch = (discordId: string, name: string, at: number, source: string) => {
        if (!discordId) return;
        const row = byId.get(discordId) || { discordId, name: name || discordId, lastSeenAt: at, sources: new Set<string>(), restrictionCount: 0, activeRoles: new Set<string>() };
        if (at >= row.lastSeenAt) { row.lastSeenAt = at; if (name) row.name = name; }
        row.sources.add(source);
        byId.set(discordId, row);
      };
      for (const row of developers) { touch(row.discordId, row.displayName || row.username, row.updatedAt || row.createdAt, "Developer profile"); const found = byId.get(row.discordId); if (found) found.developerStatus = row.status; }
      for (const row of studios) touch(row.ownerDiscordId, row.ownerName, row.updatedAt || row.createdAt, "Studio");
      for (const row of jobs) touch(row.posterDiscordId, row.posterName, row.updatedAt || row.createdAt, "Job");
      for (const row of applications) touch(row.applicantDiscordId, row.applicantName, row.updatedAt || row.createdAt, "Application");
      for (const row of tickets) touch(row.ownerDiscordId, row.ownerName, row.updatedAt || row.createdAt, "Support ticket");
      for (const row of reports) touch(row.reporterDiscordId, row.reporterDiscordId, row.updatedAt || row.createdAt, "Safety report");
      for (const row of restrictions) { touch(row.subjectDiscordId, row.subjectName, row.updatedAt || row.createdAt, "Restriction"); const found = byId.get(row.subjectDiscordId); if (found) found.restrictionCount += 1; }
      for (const row of grants) { touch(row.discordId, row.discordId, row.updatedAt || row.createdAt, "Website role"); const found = byId.get(row.discordId); if (found && row.active) found.activeRoles.add(row.roleKey); }
      rows = [...byId.values()].map(row => ({
        discordId: row.discordId, name: row.name, lastSeenAt: row.lastSeenAt,
        sources: [...row.sources].sort(), developerStatus: row.developerStatus || null,
        restrictionCount: row.restrictionCount, activeRoles: [...row.activeRoles].sort(),
      })).filter(row => matches([row.discordId, row.name, ...row.sources, row.developerStatus, ...row.activeRoles]));
      rows.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
    } else if (args.section === "studios") {
      rows = (await ctx.db.query("studios").order("desc").take(500))
        .filter(row => (!args.status || row.status === args.status) && matches([row.name, row.slug, row.ownerName, row.ownerDiscordId, row.description, ...row.specialties]))
        .map(({ _id, _creationTime, ...row }) => ({ id: _id, ...row }));
    } else if (args.section === "jobs") {
      rows = (await ctx.db.query("jobs").order("desc").take(500))
        .filter(row => (!args.status || (args.status === "pending" ? row.moderationStatus === "pending" : args.status === "rejected" ? row.moderationStatus === "rejected" : args.status === "active" ? row.moderationStatus === "active" || row.moderationStatus === undefined : row.status === args.status))
          && matches([row.title, row.description, row.craft, row.posterName, row.posterDiscordId]))
        .map(({ _id, _creationTime, ...row }) => ({ id: _id, ...row }));
    } else if (args.section === "restrictions") {
      rows = (await ctx.db.query("accountRestrictions").order("desc").take(1000))
        .filter(row => (!args.status || (args.status === "active" ? row.active && (!row.expiresAt || row.expiresAt > Date.now()) : args.status === "expired" ? row.active && !!row.expiresAt && row.expiresAt <= Date.now() : args.status === "lifted" ? !row.active : true))
          && matches([row.subjectDiscordId, row.subjectName, row.kind, row.reason, row.issuedByName]))
        .map(({ _id, _creationTime, ...row }) => ({ id: _id, ...row, effectiveStatus: !row.active ? "Lifted" : row.expiresAt && row.expiresAt <= Date.now() ? "Expired" : "Active" }));
      rows.sort((a, b) => b.createdAt - a.createdAt);
    } else if (args.section === "activity") {
      const [moderation, support, applications] = await Promise.all([
        ctx.db.query("moderationAuditEvents").order("desc").take(250),
        ctx.db.query("supportAuditEvents").order("desc").take(250),
        ctx.db.query("applicationEvents").order("desc").take(250),
      ]);
      rows = [
        ...moderation.map(row => ({ id: String(row._id), actorDiscordId: row.actorDiscordId, actorName: row.actorName, action: row.action, targetType: row.targetType, targetId: row.targetId, details: row.details || "", createdAt: row.createdAt, source: "Platform" })),
        ...support.map(row => ({ id: String(row._id), actorDiscordId: row.actorDiscordId, actorName: row.actorName, action: row.action, targetType: "ticket", targetId: String(row.ticketNumber), details: row.details || "", createdAt: row.createdAt, source: "Support" })),
        ...applications.map(row => ({ id: String(row._id), actorDiscordId: row.actorDiscordId, actorName: row.actorName, action: row.action, targetType: "application", targetId: String(row.applicationNumber), details: row.note || "", createdAt: row.createdAt, source: row.visibility === "staff" ? "Private application note" : "Application" })),
      ].filter(row => matches([row.actorDiscordId, row.actorName, row.action, row.targetType, row.targetId, row.details, row.source]));
      rows.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      const settings = await ctx.db.query("websiteSettings").order("desc").take(100);
      rows = settings.filter(row => matches([row.key, row.value, row.updatedByName]))
        .map(({ _id, _creationTime, ...row }) => ({ id: _id, ...row }));
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
      page: safePage, pageSize, total, totalPages, generatedAt: Date.now(),
    };
  },
});

export const setStudioStatus = mutation({
  args: {
    adminSecret: v.string(), studioId: v.id("studios"),
    status: v.union(v.literal("active"), v.literal("archived")),
    actorDiscordId: v.string(), actorName: v.string(), reason: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studio = await ctx.db.get(args.studioId);
    if (!studio) throw new Error("Studio not found.");
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 1000) throw new Error("A reason between 3 and 1,000 characters is required.");
    const now = Date.now();
    await ctx.db.patch(studio._id, { status: args.status, updatedAt: now });
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0,100),
      action: "studio_" + args.status, targetType: "studio", targetId: studio.slug,
      details: reason, createdAt: now,
    });
    return { success: true, studioId: studio._id, status: args.status };
  },
});

export const setJobStatus = mutation({
  args: {
    adminSecret: v.string(), jobId: v.id("jobs"),
    status: v.union(v.literal("open"), v.literal("closed")),
    actorDiscordId: v.string(), actorName: v.string(), reason: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job post not found.");
    if (args.status === "open" && (job.moderationStatus === "pending" || job.moderationStatus === "rejected")) {
      throw new Error("A pending or rejected job cannot be reopened. Review it through content moderation first.");
    }
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 1000) throw new Error("A reason between 3 and 1,000 characters is required.");
    const now = Date.now();
    await ctx.db.patch(job._id, { status: args.status, updatedAt: now });
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0,100),
      action: "job_" + args.status, targetType: "job", targetId: String(job._id),
      details: reason, createdAt: now,
    });
    return { success: true, jobId: job._id, status: args.status };
  },
});

export const createRestriction = mutation({
  args: {
    adminSecret: v.string(), subjectDiscordId: v.string(), subjectName: v.string(),
    kind: v.union(v.literal("Warning"), v.literal("Restricted"), v.literal("Suspended"), v.literal("Banned")),
    reason: v.string(), expiresAt: v.optional(v.number()),
    actorDiscordId: v.string(), actorName: v.string(),
    sourceType: v.optional(v.string()), sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const subjectDiscordId = args.subjectDiscordId.trim();
    const subjectName = args.subjectName.trim().slice(0,100);
    const reason = args.reason.trim();
    if (!/^[0-9]{5,32}$/.test(subjectDiscordId)) throw new Error("Enter a valid Discord user ID.");
    if (subjectDiscordId === args.actorDiscordId) throw new Error("You cannot restrict your own account.");
    if (subjectName.length < 1 || reason.length < 3 || reason.length > 2000) throw new Error("A member name and a reason between 3 and 2,000 characters are required.");
    if (args.expiresAt !== undefined && (!Number.isFinite(args.expiresAt) || args.expiresAt <= Date.now())) throw new Error("Expiration must be a future date.");
    if (args.kind === "Warning" && args.expiresAt !== undefined) throw new Error("Warnings do not need an expiration date.");
    const now = Date.now();
    const id = await ctx.db.insert("accountRestrictions", {
      subjectDiscordId, subjectName, kind: args.kind, reason, active: true,
      issuedByDiscordId: args.actorDiscordId, issuedByName: args.actorName.slice(0,100),
      createdAt: now, updatedAt: now, startsAt: now,
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
      ...(args.sourceType ? { sourceType: args.sourceType.slice(0,40) } : {}),
      ...(args.sourceId ? { sourceId: args.sourceId.slice(0,100) } : {}),
    });
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0,100),
      action: "account_restriction_created", targetType: "member", targetId: subjectDiscordId,
      details: args.kind + ": " + reason, createdAt: now,
    });
    return { success: true, id, kind: args.kind, subjectDiscordId };
  },
});

export const liftRestriction = mutation({
  args: {
    adminSecret: v.string(), restrictionId: v.id("accountRestrictions"),
    actorDiscordId: v.string(), actorName: v.string(), reason: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const restriction = await ctx.db.get(args.restrictionId);
    if (!restriction) throw new Error("Restriction not found.");
    if (!restriction.active) throw new Error("This restriction has already been lifted.");
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 1000) throw new Error("A lift reason between 3 and 1,000 characters is required.");
    const now = Date.now();
    await ctx.db.patch(restriction._id, {
      active: false, updatedAt: now, liftedAt: now,
      liftedByDiscordId: args.actorDiscordId, liftedByName: args.actorName.slice(0,100),
      liftReason: reason,
    });
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0,100),
      action: "account_restriction_lifted", targetType: "member", targetId: restriction.subjectDiscordId,
      details: reason, createdAt: now,
    });
    return { success: true, id: restriction._id };
  },
});

const settingKey = v.union(v.literal("announcement"), v.literal("announcementEnabled"), v.literal("homepageFeaturedText"));
export const saveWebsiteSetting = mutation({
  args: { adminSecret: v.string(), key: settingKey, value: v.string(), actorDiscordId: v.string(), actorName: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (args.value.length > (args.key === "announcement" ? 1000 : 300)) throw new Error("Setting value is too long.");
    if (args.key === "announcementEnabled" && !["true", "false"].includes(args.value)) throw new Error("Announcement enabled must be true or false.");
    const now = Date.now();
    const existing = await ctx.db.query("websiteSettings").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (existing) await ctx.db.patch(existing._id, { value: args.value, updatedAt: now, updatedByDiscordId: args.actorDiscordId, updatedByName: args.actorName.slice(0,100) });
    else await ctx.db.insert("websiteSettings", { key: args.key, value: args.value, updatedAt: now, updatedByDiscordId: args.actorDiscordId, updatedByName: args.actorName.slice(0,100) });
    await ctx.db.insert("moderationAuditEvents", { actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0,100), action: "website_setting_updated", targetType: "website_setting", targetId: args.key, details: "Value updated", createdAt: now });
    return { success: true, key: args.key, updatedAt: now };
  },
});

export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("websiteSettings").collect();
    const settings = Object.fromEntries(rows.map(row => [row.key, row.value]));
    return {
      announcement: typeof settings.announcement === "string" ? settings.announcement.slice(0,1000) : "",
      announcementEnabled: settings.announcementEnabled === "true",
      homepageFeaturedText: typeof settings.homepageFeaturedText === "string" ? settings.homepageFeaturedText.slice(0,300) : "",
    };
  },
});


export const getActiveRestriction = query({
  args: { adminSecret: v.string(), subjectDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    const rows = await ctx.db.query("accountRestrictions")
      .withIndex("by_subject_active", q => q.eq("subjectDiscordId", args.subjectDiscordId).eq("active", true))
      .collect();
    const active = rows.filter(row => row.startsAt <= now && (!row.expiresAt || row.expiresAt > now))
      .sort((a, b) => {
        const rank: Record<string, number> = { Banned: 4, Suspended: 3, Restricted: 2, Warning: 1 };
        return (rank[b.kind] || 0) - (rank[a.kind] || 0) || b.createdAt - a.createdAt;
      });
    const strongest = active[0];
    if (!strongest) return null;
    return {
      id: strongest._id,
      kind: strongest.kind,
      reason: strongest.reason,
      createdAt: strongest.createdAt,
      expiresAt: strongest.expiresAt ?? null,
    };
  },
});
