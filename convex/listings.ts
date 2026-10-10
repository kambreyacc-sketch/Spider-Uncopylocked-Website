import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Public visitors can browse only listings that have been reviewed and activated.
export const publicListings = query({
  args: {
    type: v.optional(v.union(v.literal("Game"), v.literal("UGC Group"))),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("listings")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
    return args.type ? rows.filter((row) => row.type === args.type) : rows;
  },
});

// New submissions remain pending until an owner/moderator reviews them.
// This endpoint must be protected with authenticated identity before enabling public submissions.
export const submitListing = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("Game"), v.literal("UGC Group")),
    robloxUrl: v.string(),
    price: v.number(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    sellerRobloxId: v.string(),
    sellerName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim() || args.title.length > 80) throw new Error("Enter a listing title under 80 characters.");
    if (!/^https?:\/\/(www\.)?roblox\.com\//i.test(args.robloxUrl)) throw new Error("Enter a valid Roblox URL.");
    if (!Number.isFinite(args.price) || args.price <= 0) throw new Error("Price must be greater than zero.");
    if (args.description.length > 2000) throw new Error("Description is too long.");
    return await ctx.db.insert("listings", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
