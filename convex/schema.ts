import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
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
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("rejected")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"])
    .index("by_seller", ["sellerRobloxId"]),
  resources: defineTable({
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
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("removed")),
  }).index("by_status_createdAt", ["status", "createdAt"]),
});
