import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
    title: v.string(), type: v.union(v.literal("Game"), v.literal("UGC Group")), robloxUrl: v.string(),
    price: v.number(), description: v.string(), imageStorageId: v.optional(v.id("_storage")), imageUrl: v.optional(v.string()),
    sellerRobloxId: v.string(), sellerName: v.string(), contactDiscord: v.optional(v.string()), contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()), status: v.union(v.literal("pending"), v.literal("active"), v.literal("rejected")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_seller", ["sellerRobloxId"]),
  resources: defineTable({
    title: v.string(), category: v.union(v.literal("Packs"),v.literal("Maps"),v.literal("Audio"),v.literal("Scripts"),v.literal("UI"),v.literal("VFX")),
    description: v.string(), tags: v.array(v.string()), platform: v.union(v.literal("Roblox"),v.literal("Discord"),v.literal("Other")),
    license: v.union(v.literal("Personal use"),v.literal("Commercial use"),v.literal("Credit required")), version: v.optional(v.string()),
    thumbnailStorageId: v.id("_storage"), previewStorageIds: v.array(v.id("_storage")), fileStorageId: v.id("_storage"),
    fileName: v.string(), fileSize: v.number(), fileLink: v.optional(v.string()), price: v.number(),
    creatorName: v.string(), creatorDiscordId: v.string(), status: v.union(v.literal("pending"),v.literal("active"),v.literal("rejected")),
    reviewReason: v.optional(v.string()), createdAt: v.number(), reviewedAt: v.optional(v.number()),
  }).index("by_status_createdAt", ["status","createdAt"]).index("by_creator_createdAt", ["creatorDiscordId","createdAt"]).index("by_creator_title", ["creatorDiscordId","title"]),
});
