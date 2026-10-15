import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdminSecret(secret: string) { const expected = process.env.ADMIN_API_SECRET; if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized listing upload."); }

export const generateUploadUrl = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => { assertAdminSecret(args.adminSecret); return await ctx.storage.generateUploadUrl(); },
});

export const publicListings = query({
  args: { type: v.optional(v.union(v.literal("Game"), v.literal("UGC Group"))) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("listings")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
    const filtered = args.type ? rows.filter((row) => row.type === args.type) : rows;
    return await Promise.all(filtered.map(async (row) => ({
      ...row,
      imageUrl: row.imageStorageId ? await ctx.storage.getUrl(row.imageStorageId) : row.imageUrl,
    })));
  },
});

function assertAdminSecret(secret: string) { const expected = process.env.ADMIN_API_SECRET; if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized listing submission."); }

export const submitListing = mutation({
  args: {
    adminSecret: v.string(),
    title: v.string(),
    type: v.union(v.literal("Game"), v.literal("UGC Group")),
    robloxUrl: v.string(),
    price: v.number(),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    sellerRobloxId: v.string(),
    sellerName: v.string(),
    contactDiscord: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!args.title.trim() || args.title.length > 80) throw new Error("Enter a listing title under 80 characters.");
    if (!/^https?:\/\/(www\.)?roblox\.com\//i.test(args.robloxUrl)) throw new Error("Enter a valid Roblox URL.");
    if (!Number.isFinite(args.price) || args.price <= 0) throw new Error("Price must be greater than zero.");
    if (args.description.length > 2000) throw new Error("Description is too long.");
    if (!(args.contactDiscord?.trim() || args.contactEmail?.trim() || args.contactPhone?.trim())) throw new Error("Add at least one contact method: Discord, email, or phone.");
    const { adminSecret, ...listingArgs } = args;
    return await ctx.db.insert("listings", {
      ...listingArgs,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
