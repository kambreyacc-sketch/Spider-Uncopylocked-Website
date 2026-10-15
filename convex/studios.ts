import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized studio service request.");
  }
}

export const publicList = query({
  args: { adminSecret: v.string(), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studios = await ctx.db.query("studios")
      .withIndex("by_status_createdAt", q => q.eq("status", "active"))
      .order("desc")
      .take(100);
    const term = args.search?.trim().toLowerCase();
    return studios
      .filter(studio => !term || [
        studio.name, studio.slug, studio.description, ...studio.specialties, studio.ownerName,
      ].join(" ").toLowerCase().includes(term))
      .map(({ _id, _creationTime, ...studio }) => ({ id: _id, ...studio }));
  },
});

export const mine = query({
  args: { adminSecret: v.string(), ownerDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studios = await ctx.db.query("studios")
      .withIndex("by_owner", q => q.eq("ownerDiscordId", args.ownerDiscordId))
      .order("desc")
      .take(100);
    return studios.map(({ _id, _creationTime, ...studio }) => ({ id: _id, ...studio }));
  },
});

export const create = mutation({
  args: {
    adminSecret: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    specialties: v.array(v.string()),
    ownerDiscordId: v.string(),
    ownerName: v.string(),
    ownerAvatar: v.optional(v.string()),
    robloxUrl: v.optional(v.string()),
    discordUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const name = args.name.trim();
    const slug = args.slug.trim().toLowerCase();
    const description = args.description.trim();
    const specialties = [...new Set(args.specialties.map(item => item.trim()).filter(Boolean))].slice(0, 10);
    if (name.length < 3 || name.length > 60) throw new Error("Studio name must be 3–60 characters.");
    if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)) throw new Error("Studio handle must be 3–32 lowercase letters, numbers, or hyphens.");
    if (description.length < 20 || description.length > 1200) throw new Error("Studio description must be 20–1,200 characters.");
    if (!args.ownerDiscordId.trim() || !args.ownerName.trim()) throw new Error("Sign in with Discord to create a studio.");
    if (specialties.length === 0) throw new Error("Add at least one studio specialty.");
    if (args.robloxUrl && (!/^https:\/\//i.test(args.robloxUrl) || !/roblox\.com\//i.test(args.robloxUrl))) throw new Error("Use a valid HTTPS Roblox group or game URL.");
    if (args.discordUrl && (!/^https:\/\//i.test(args.discordUrl) || !/(discord\.gg|discord\.com\/invite)/i.test(args.discordUrl))) throw new Error("Use a valid HTTPS Discord invite URL.");
    const existing = await ctx.db.query("studios").withIndex("by_slug", q => q.eq("slug", slug)).unique();
    if (existing) throw new Error("That studio handle is already in use. Choose another.");
    const now = Date.now();
    const id = await ctx.db.insert("studios", {
      name, slug, description, specialties,
      ownerDiscordId: args.ownerDiscordId,
      ownerName: args.ownerName.trim(),
      ...(args.ownerAvatar ? { ownerAvatar: args.ownerAvatar } : {}),
      ...(args.robloxUrl ? { robloxUrl: args.robloxUrl } : {}),
      ...(args.discordUrl ? { discordUrl: args.discordUrl } : {}),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return { id, slug };
  },
});
