import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("resources")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
      .order("desc").collect();
    return await Promise.all(rows.map(async (row) => ({
      ...row,
      thumbnailUrl: row.thumbnailStorageId ? await ctx.storage.getUrl(row.thumbnailStorageId) : null,
      downloadUrl: await ctx.storage.getUrl(row.fileStorageId),
    })));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const publish = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(v.literal("Model"), v.literal("Script"), v.literal("Template"), v.literal("Other")),
    setup: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    creatorName: v.string(),
    creatorDiscordId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim() || args.title.length > 100) throw new Error("Title must be 1–100 characters.");
    if (!args.description.trim() || args.description.length > 3000) throw new Error("Add a description under 3000 characters.");
    if (args.setup && args.setup.length > 5000) throw new Error("Setup instructions must be under 5000 characters.");
    if (!args.fileName.trim() || args.fileSize <= 0 || args.fileSize > 50 * 1024 * 1024) throw new Error("Asset files must be smaller than 50 MB.");
    if (!args.creatorName.trim()) throw new Error("Enter a creator name.");
    return await ctx.db.insert("resources", { ...args, status: "active", createdAt: Date.now() });
  },
});
