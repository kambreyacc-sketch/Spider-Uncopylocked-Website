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
  developers: defineTable({
    username: v.string(), displayName: v.string(), discordId: v.string(), avatarUrl: v.string(), headline: v.string(), bio: v.string(),
    crafts: v.array(v.string()), skills: v.array(v.string()), services: v.array(v.object({ title: v.string(), description: v.string(), price: v.number() })),
    rateType: v.union(v.literal("hourly"), v.literal("project"), v.literal("negotiable")), rateAmount: v.optional(v.number()),
    availability: v.union(v.literal("Available"), v.literal("Busy"), v.literal("Not taking commissions")),
    portfolio: v.array(v.object({ url: v.string(), caption: v.string() })), videoUrl: v.optional(v.string()), discordUsername: v.string(), robloxUrl: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")), verified: v.boolean(), createdAt: v.number(), updatedAt: v.number(),
    reviewReason: v.optional(v.string()),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_username", ["username"]).index("by_discord", ["discordId"]),
  developerReports: defineTable({ developerId: v.id("developers"), reporterDiscordId: v.string(), reason: v.string(), details: v.string(), createdAt: v.number(), status: v.union(v.literal("open"), v.literal("reviewed")) }).index("by_status_createdAt", ["status", "createdAt"]),
  developerReviews: defineTable({ developerId: v.id("developers"), reviewerDiscordId: v.string(), reviewerName: v.string(), rating: v.number(), comment: v.string(), createdAt: v.number() }).index("by_developer_createdAt", ["developerId", "createdAt"]),
  jobs: defineTable({
    title: v.string(), description: v.string(), craft: v.string(), budgetMin: v.number(), budgetMax: v.number(), deadline: v.optional(v.string()),
    discordContact: v.string(), posterDiscordId: v.string(), posterName: v.string(), status: v.union(v.literal("open"), v.literal("closed")),
    createdAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_poster", ["posterDiscordId"]),
});
