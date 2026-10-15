import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const submit = mutation({
  args: { writeKey:v.string(), reference:v.string(), reporterDiscordId:v.string(), reportedType:v.string(), targetUrl:v.string(), reason:v.string(), details:v.string() },
  handler: async (ctx,args) => {
    const expected=process.env.REPORT_WRITE_SECRET;
    if(!expected || args.writeKey!==expected) throw new Error("Unauthorized report submission.");
    if(args.reference.length>40 || args.reporterDiscordId.length>40 || args.reportedType.length>80 || args.targetUrl.length>500 || args.reason.length>120 || args.details.length<15 || args.details.length>2500) throw new Error("Please check the report details.");
    const now=Date.now();
    const {writeKey,...report}=args;
    await ctx.db.insert("scamReports",{...report,status:"submitted",createdAt:now,updatedAt:now});
    return {reference:args.reference};
  }
});
export const mine = query({
  args: { writeKey: v.string(), reporterDiscordId: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.REPORT_WRITE_SECRET;
    if (!expected || args.writeKey.length !== expected.length || args.writeKey !== expected) throw new Error("Unauthorized report lookup.");
    const rows = await ctx.db.query("scamReports")
      .withIndex("by_reporter_createdAt", q => q.eq("reporterDiscordId", args.reporterDiscordId))
      .order("desc").take(100);
    // Never expose staff assignment or private review notes to the reporting member.
    return rows.map(({ _id, _creationTime, reference, reportedType, targetUrl, reason, details, status, createdAt, updatedAt }) => ({
      _id, reference, reportedType, targetUrl, reason, details, status, createdAt, updatedAt,
    }));
  },
});

function assertAdminSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized report review.");
}

const reportStatus = v.union(
  v.literal("submitted"), v.literal("pending"), v.literal("under_investigation"),
  v.literal("additional_information_requested"), v.literal("action_taken"),
  v.literal("dismissed"), v.literal("closed")
);

export const listForStaff = query({
  args: { adminSecret: v.string(), status: v.optional(reportStatus) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (args.status) return await ctx.db.query("scamReports")
      .withIndex("by_status_createdAt", q => q.eq("status", args.status))
      .order("desc").take(250);
    return await ctx.db.query("scamReports").order("desc").take(250);
  },
});

export const updateForStaff = mutation({
  args: {
    adminSecret: v.string(),
    reference: v.string(),
    status: reportStatus,
    actorDiscordId: v.string(),
    actorName: v.string(),
    reviewNotes: v.optional(v.string()),
    assignedToDiscordId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const report = await ctx.db.query("scamReports")
      .withIndex("by_reference", q => q.eq("reference", args.reference)).unique();
    if (!report) throw new Error("Report not found.");
    if (args.reviewNotes && args.reviewNotes.length > 3000) throw new Error("Review notes must be 3,000 characters or fewer.");
    if (["dismissed", "action_taken"].includes(args.status) && !args.reviewNotes?.trim()) throw new Error("Add an internal reason before closing or actioning a report.");
    const now = Date.now();
    const patch: any = {
      status: args.status,
      updatedAt: now,
      reviewedAt: now,
      reviewedByDiscordId: args.actorDiscordId,
      reviewedByName: args.actorName.slice(0, 100),
      ...(args.reviewNotes?.trim() ? { reviewNotes: args.reviewNotes.trim() } : {}),
    };
    if (args.assignedToDiscordId !== undefined) {
      if (args.assignedToDiscordId.trim()) {
        patch.assignedToDiscordId = args.assignedToDiscordId.trim();
        patch.assignedToName = (args.assignedToName || args.assignedToDiscordId).slice(0, 100);
      } else {
        patch.assignedToDiscordId = undefined;
        patch.assignedToName = undefined;
      }
    }
    await ctx.db.patch(report._id, patch);
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
      action: "scam_report_" + args.status, targetType: "scam_report", targetId: args.reference,
      details: args.reviewNotes?.trim(), createdAt: now,
    });
    return { success: true, reference: report.reference, status: args.status };
  },
});
