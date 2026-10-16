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


export const bySlug = query({
  args: { adminSecret: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studio = await ctx.db.query("studios").withIndex("by_slug", q => q.eq("slug", args.slug)).unique();
    if (!studio || studio.status !== "active") return null;
    const { _id, _creationTime, ...data } = studio;
    return { id: _id, ...data };
  },
});

export const openRoles = query({
  args: { adminSecret: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studio = await ctx.db.query("studios").withIndex("by_slug", q => q.eq("slug", args.slug)).unique();
    if (!studio || studio.status !== "active") return [];
    const roles = await ctx.db.query("studioRoles")
      .withIndex("by_studio_status_createdAt", q => q.eq("studioId", studio._id).eq("status", "open"))
      .order("desc").take(100);
    return roles.map(({ _id, _creationTime, ...role }) => ({ id: _id, ...role }));
  },
});

export const createRole = mutation({
  args: {
    adminSecret: v.string(), studioId: v.id("studios"), ownerDiscordId: v.string(),
    title: v.string(), description: v.string(),
    roleType: v.union(v.literal("Full-time"), v.literal("Contract"), v.literal("Commission"), v.literal("Volunteer")),
    compensation: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studio = await ctx.db.get(args.studioId);
    if (!studio || studio.ownerDiscordId !== args.ownerDiscordId) throw new Error("Only the studio owner can manage roles.");
    const title = args.title.trim();
    const description = args.description.trim();
    const compensation = args.compensation.trim();
    if (title.length < 3 || title.length > 80) throw new Error("Role title must be 3–80 characters.");
    if (description.length < 20 || description.length > 3000) throw new Error("Role description must be 20–3,000 characters.");
    if (compensation.length > 120) throw new Error("Compensation must be 120 characters or fewer.");
    const now = Date.now();
    return await ctx.db.insert("studioRoles", { studioId: args.studioId, title, description, roleType: args.roleType, compensation, status: "open", createdAt: now, updatedAt: now });
  },
});

export const applicationsForOwner = query({
  args: { adminSecret: v.string(), studioId: v.id("studios"), ownerDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const studio = await ctx.db.get(args.studioId);
    if (!studio || studio.ownerDiscordId !== args.ownerDiscordId) throw new Error("Only the studio owner can view applications.");
    const apps = await ctx.db.query("studioApplications")
      .withIndex("by_studio_createdAt", q => q.eq("studioId", args.studioId))
      .order("desc").take(200);
    return await Promise.all(apps.map(async app => {
      const role = await ctx.db.get(app.roleId);
      return { ...app, id: app._id, roleTitle: role?.title ?? "Deleted role" };
    }));
  },
});

export const manageRole = mutation({
  args: { adminSecret: v.string(), roleId: v.id("studioRoles"), ownerDiscordId: v.string(), status: v.union(v.literal("open"), v.literal("closed")) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found.");
    const studio = await ctx.db.get(role.studioId);
    if (!studio || studio.ownerDiscordId !== args.ownerDiscordId) throw new Error("Only the studio owner can manage roles.");
    await ctx.db.patch(args.roleId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const applyToRole = mutation({
  args: {
    adminSecret: v.string(), roleId: v.id("studioRoles"), applicantDiscordId: v.string(),
    applicantName: v.string(), portfolioUrl: v.optional(v.string()), experience: v.optional(v.string()),
    message: v.string(), attachments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const role = await ctx.db.get(args.roleId);
    if (!role || role.status !== "open") throw new Error("This role is no longer accepting applications.");
    if (args.applicantDiscordId === (await ctx.db.get(role.studioId))?.ownerDiscordId) throw new Error("Studio owners cannot apply to their own role.");
    const message = args.message.trim();
    if (message.length < 20 || message.length > 3000) throw new Error("Application message must be 20–3,000 characters.");
    const portfolioUrl = args.portfolioUrl?.trim();
    if (portfolioUrl && !/^https:\/\//i.test(portfolioUrl)) throw new Error("Portfolio link must use HTTPS.");
    const attachments = args.attachments.map(x => x.trim()).filter(x => /^https:\/\//i.test(x)).slice(0, 5);
    const prior = await ctx.db.query("studioApplications")
      .withIndex("by_role_createdAt", q => q.eq("roleId", args.roleId))
      .collect();
    if (prior.some(app => app.applicantDiscordId === args.applicantDiscordId)) throw new Error("You have already applied for this role.");
    const now = Date.now();
    return await ctx.db.insert("studioApplications", {
      studioId: role.studioId, roleId: args.roleId, applicantDiscordId: args.applicantDiscordId,
      applicantName: args.applicantName.trim(), ...(portfolioUrl ? { portfolioUrl } : {}),
      ...(args.experience?.trim() ? { experience: args.experience.trim().slice(0, 1000) } : {}),
      message, attachments, status: "new", createdAt: now, updatedAt: now,
    });
  },
});

export const updateApplicationStatus = mutation({
  args: {
    adminSecret: v.string(), applicationId: v.id("studioApplications"), ownerDiscordId: v.string(),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("shortlisted"), v.literal("accepted"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");
    const studio = await ctx.db.get(app.studioId);
    if (!studio || studio.ownerDiscordId !== args.ownerDiscordId) throw new Error("Only the studio owner can review applications.");
    await ctx.db.patch(args.applicationId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});
