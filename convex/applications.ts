import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
function assertServiceSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized application service request.");
}
const applicationType = v.union(v.literal("Studio Registration"), v.literal("Posting Access"), v.literal("Content Creator"), v.literal("Staff Application"), v.literal("Hiring Access"));
const answers = v.array(v.object({ key: v.string(), label: v.string(), value: v.string() }));
export const submit = mutation({
  args: { adminSecret: v.string(), applicationType, applicantDiscordId: v.string(), applicantName: v.string(), title: v.string(), summary: v.string(), links: v.array(v.string()), answers },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    if (!/^\d{5,25}$/.test(args.applicantDiscordId)) throw new Error("A verified Discord identity is required.");
    const title = args.title.trim(), summary = args.summary.trim();
    if (title.length < 3 || title.length > 100) throw new Error("Title must be 3–100 characters.");
    if (summary.length < 30 || summary.length > 5000) throw new Error("Summary must be 30–5,000 characters.");
    if (args.links.length > 10 || args.links.some(link => link.length > 500 || !/^https:\/\//i.test(link))) throw new Error("Links must be HTTPS URLs; up to 10 links are allowed.");
    if (args.answers.length > 20 || args.answers.some(a => !a.key.trim() || !a.label.trim() || a.value.length > 2000)) throw new Error("Application answers exceed the allowed limits.");
    const prior = await ctx.db.query("platformApplications").withIndex("by_applicant_createdAt", q => q.eq("applicantDiscordId", args.applicantDiscordId)).collect();
    if (prior.some(a => a.applicationType === args.applicationType && ["pending", "in_review"].includes(a.status))) {
      throw new Error("You already have an application of this type awaiting review.");
    }
    const now = Date.now();
    return await ctx.db.insert("platformApplications", {
      applicationType: args.applicationType, applicantDiscordId: args.applicantDiscordId,
      applicantName: args.applicantName.slice(0, 100), title, summary, links: args.links,
      answers: args.answers, status: "pending", createdAt: now, updatedAt: now,
    });
  }
});
export const listMine = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    if (!/^\d{5,25}$/.test(args.applicantDiscordId)) throw new Error("A verified Discord identity is required.");
    return await ctx.db.query("platformApplications").withIndex("by_applicant_createdAt", q => q.eq("applicantDiscordId", args.applicantDiscordId)).order("desc").take(100);
  }
});
