import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const craft = v.string();
const service = v.object({ title: v.string(), description: v.string(), price: v.number() });
const portfolioItem = v.object({ url: v.string(), caption: v.string() });

export const list = query({
  args: { craft: v.optional(v.string()), search: v.optional(v.string()), sort: v.optional(v.union(v.literal("newest"), v.literal("rating"), v.literal("price"))) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("developers").withIndex("by_status_createdAt", q => q.eq("status", "approved")).order("desc").collect();
    const term = args.search?.trim().toLowerCase();
    const filtered = rows.filter(d => (!args.craft || args.craft === "All" || d.crafts.includes(args.craft)) && (!term || [d.username,d.displayName,d.headline,d.bio,...d.crafts,...d.skills].join(" ").toLowerCase().includes(term)));
    const enriched = await Promise.all(filtered.map(async d => {
      const reviews = await ctx.db.query("developerReviews").withIndex("by_developer_createdAt", q => q.eq("developerId", d._id)).collect();
      const rating = reviews.length ? reviews.reduce((sum,r) => sum+r.rating,0)/reviews.length : 0;
      return { ...d, rating, reviewCount: reviews.length };
    }));
    if (args.sort === "price") enriched.sort((a,b) => (a.rateAmount ?? Number.MAX_SAFE_INTEGER)-(b.rateAmount ?? Number.MAX_SAFE_INTEGER));
    else if (args.sort === "rating") enriched.sort((a,b) => b.rating-a.rating || b.createdAt-a.createdAt);
    else enriched.sort((a,b) => b.createdAt-a.createdAt);
    return enriched;
  },
});

export const byUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("developers").withIndex("by_username", q => q.eq("username", args.username.toLowerCase())).first();
    if (!user || user.status !== "approved") return null;
    const reviews = await ctx.db.query("developerReviews").withIndex("by_developer_createdAt", q => q.eq("developerId", user._id)).order("desc").collect();
    const rating = reviews.length ? reviews.reduce((sum,r) => sum+r.rating,0)/reviews.length : 0;
    return { ...user, rating, reviewCount: reviews.length, reviews };
  },
});

export const mine = query({
  args: { discordId: v.string() },
  handler: async (ctx, args) => await ctx.db.query("developers").withIndex("by_discord", q => q.eq("discordId", args.discordId)).collect(),
});

export const submit = mutation({
  args: {
    username: v.string(), displayName: v.string(), discordId: v.string(), avatarUrl: v.string(), headline: v.string(), bio: v.string(),
    crafts: v.array(craft), skills: v.array(v.string()), services: v.array(service),
    rateType: v.union(v.literal("hourly"),v.literal("project"),v.literal("negotiable")), rateAmount: v.optional(v.number()),
    availability: v.union(v.literal("Available"),v.literal("Busy"),v.literal("Not taking commissions")),
    portfolio: v.array(portfolioItem), videoUrl: v.optional(v.string()), discordUsername: v.string(), robloxUrl: v.string(),
  },
  handler: async (ctx,args) => {
    const username = args.username.trim().toLowerCase().replace(/^@/,"");
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new Error("Username must be 3–20 letters, numbers, or underscores.");
    if (!args.discordId.trim() || !args.displayName.trim()) throw new Error("Sign in with Discord and add a display name.");
    if (args.displayName.trim().length > 40 || args.headline.trim().length < 5 || args.headline.length > 100) throw new Error("Add a display name and a headline between 5 and 100 characters.");
    if (!args.bio.trim() || args.bio.length > 2000) throw new Error("Bio is required and must be 2,000 characters or fewer.");
    if (args.crafts.length < 1 || args.crafts.length > 9) throw new Error("Choose at least one craft.");
    if (args.skills.length > 25 || args.skills.some(s => !s.trim() || s.length > 32)) throw new Error("Use up to 25 skill tags, each 32 characters or fewer.");
    if (args.services.length > 12 || args.services.some(s => !s.title.trim() || s.title.length > 80 || s.description.length > 240 || !Number.isFinite(s.price) || s.price < 0)) throw new Error("Check your service titles, descriptions, and prices.");
    if (args.portfolio.length < 3 || args.portfolio.length > 9 || args.portfolio.some(p => !/^https:\/\//i.test(p.url) || p.caption.length > 120)) throw new Error("Add 3–9 portfolio images using HTTPS links.");
    if (!/^https:\/\//i.test(args.robloxUrl) || !/roblox\.com\//i.test(args.robloxUrl)) throw new Error("Add a valid Roblox profile link.");
    if (args.avatarUrl && !/^https:\/\//i.test(args.avatarUrl)) throw new Error("Avatar URL must use HTTPS.");
    if (args.videoUrl && !/^https:\/\//i.test(args.videoUrl)) throw new Error("Video link must use HTTPS.");
    const existingName = await ctx.db.query("developers").withIndex("by_username", q => q.eq("username", username)).first();
    if (existingName && existingName.discordId !== args.discordId) throw new Error("That developer username is already taken.");
    const mine = await ctx.db.query("developers").withIndex("by_discord", q => q.eq("discordId", args.discordId)).first();
    const data = { ...args, username, displayName: args.displayName.trim(), headline: args.headline.trim(), bio: args.bio.trim(), status: "approved" as const, verified: mine?.verified ?? false, createdAt: mine?.createdAt ?? Date.now(), updatedAt: Date.now() };
    if (mine) return await ctx.db.patch(mine._id, data);
    return await ctx.db.insert("developers", data);
  },
});

export const removeMine = mutation({
  args: { discordId: v.string(), developerId: v.id("developers") },
  handler: async (ctx,args) => {
    const d = await ctx.db.get(args.developerId);
    if (!d || d.discordId !== args.discordId) throw new Error("You can only delete your own developer profile.");
    await ctx.db.delete(args.developerId);
    return true;
  },
});

export const report = mutation({
  args: { developerId: v.id("developers"), reporterDiscordId: v.string(), reason: v.string(), details: v.string() },
  handler: async (ctx,args) => {
    if (!args.reporterDiscordId.trim()) throw new Error("Sign in with Discord to report a profile.");
    if (args.reason.trim().length < 3 || args.reason.length > 100 || args.details.length > 1000) throw new Error("Add a valid report reason.");
    const developer = await ctx.db.get(args.developerId);
    if (!developer || developer.status !== "approved") throw new Error("That profile is unavailable.");
    return await ctx.db.insert("developerReports", { ...args, createdAt: Date.now(), status: "open" });
  },
});

function assertAdminSecret(secret: string) { const expected = process.env.ADMIN_API_SECRET; if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized job submission."); }

export const postJob = mutation({
  args: { adminSecret: v.string(), title: v.string(), description: v.string(), craft: v.string(), budgetMin: v.number(), budgetMax: v.number(), deadline: v.optional(v.string()), discordContact: v.string(), posterDiscordId: v.string(), posterName: v.string() },
  handler: async (ctx,args) => {
    assertAdminSecret(args.adminSecret);
    if (!args.posterDiscordId.trim()) throw new Error("Sign in with Discord before posting a job.");
    if (args.title.trim().length < 5 || args.title.length > 100) throw new Error("Job title must be 5–100 characters.");
    if (!args.description.trim() || args.description.length > 3000) throw new Error("Description is required and must be 3,000 characters or fewer.");
    if (!args.craft.trim() || args.craft.length > 40) throw new Error("Choose a craft.");
    if (!Number.isFinite(args.budgetMin) || !Number.isFinite(args.budgetMax) || args.budgetMin < 0 || args.budgetMax < args.budgetMin || args.budgetMax > 1000000) throw new Error("Enter a valid budget range.");
    if (!args.discordContact.trim() || args.discordContact.length > 80) throw new Error("Add a Discord contact.");
    if (args.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(args.deadline)) throw new Error("Choose a valid deadline.");
    const { adminSecret, ...job } = args;
    const now = Date.now();
    return await ctx.db.insert("jobs", { ...job, title: args.title.trim(), status: "open", moderationStatus: "pending", createdAt: now, updatedAt: now });
  },
});

export const jobsList = query({
  args: { craft: v.optional(v.string()), search: v.optional(v.string()) },
  handler: async (ctx,args) => {
    const rows = await ctx.db.query("jobs").withIndex("by_status_createdAt", q => q.eq("status","open")).order("desc").collect();
    const term=args.search?.trim().toLowerCase();
    return rows.filter(j => j.moderationStatus !== "pending" && j.moderationStatus !== "rejected" && (!args.craft || args.craft === "All" || j.craft === args.craft) && (!term || (j.title+" "+j.description+" "+j.craft).toLowerCase().includes(term)));
  },
});
