import { query } from "./_generated/server";
import { v } from "convex/values";

function assertServiceSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized role lookup.");
}
const capabilitiesByRole: Record<string, string[]> = {
  support: ["support.view", "support.reply", "support.manage"],
  review: ["applications.view", "applications.review"],
  moderate: ["content.view", "content.review", "reports.view", "reports.review", "support.view", "support.reply"],
  moderation_manage: ["content.view", "content.review", "reports.view", "reports.review", "support.view", "support.reply", "support.manage", "restrictions.view", "restrictions.manage", "applications.view"],
  staff_manage: ["support.view", "support.reply", "support.manage", "applications.view", "applications.review", "content.view", "content.review", "reports.view", "reports.review", "restrictions.view", "restrictions.manage", "roles.view"],
};

export const capabilitiesForMember = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    if (!args.discordId.trim()) return [];
    const grants = await ctx.db.query("websiteRoleGrants")
      .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
      .collect();
    const capabilities = new Set<string>();
    for (const grant of grants) {
      if (!grant.active) continue;
      for (const capability of capabilitiesByRole[grant.roleKey] || []) capabilities.add(capability);
    }
    return [...capabilities];
  },
});
