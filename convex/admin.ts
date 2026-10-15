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
    const [resources, listings] = await Promise.all([
      ctx.db.query("resources").withIndex("by_status_createdAt", q => q.eq("status", "pending")).order("desc").take(250),
      ctx.db.query("listings").withIndex("by_status_createdAt", q => q.eq("status", "pending")).order("desc").take(250),
    ]);
    // Do not return storage URLs for unreviewed files. Review metadata first; actual
    // file/image screening remains unavailable until a scanner and protected preview proxy are configured.
    return {
      resources: resources.map(({ _id, _creationTime, thumbnailStorageId, previewStorageIds, fileStorageId, ...item }) => ({ id: _id, ...item })),
      listings: listings.map(({ _id, _creationTime, imageStorageId, ...item }) => ({ id: _id, ...item })),
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
