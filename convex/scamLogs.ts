import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET || process.env.REPORT_WRITE_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized scam-log request.");
}

export const publicList = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("scamLogEntries").withIndex("by_visibility_status_createdAt", q => q.eq("visibility", "public").eq("status", "confirmed")).order("desc").take(200);
    const term = (args.search || "").trim().toLowerCase();
    return rows.filter(r => !term || [r.reference,r.discordId,r.discordUsername,r.robloxId,r.robloxUsername,r.reason,r.summary].some(x => x?.toLowerCase().includes(term)))
      .map(({evidenceStorageIds, evidenceLinks, reporterDiscordId, ...safe}) => ({...safe, evidenceCount:evidenceStorageIds.length + evidenceLinks.length}));
  }
});

export const publicGet = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db.query("scamLogEntries").withIndex("by_reference", q => q.eq("reference", args.reference)).first();
    if (!row || row.visibility !== "public" || row.status !== "confirmed") return null;
    const {evidenceStorageIds, evidenceLinks, reporterDiscordId, ...safe} = row;
    return {...safe, evidenceCount:evidenceStorageIds.length + evidenceLinks.length};
  }
});

export const submit = mutation({
  args: { adminSecret:v.string(), reference:v.string(), targetType:v.union(v.literal("Discord"),v.literal("Roblox"),v.literal("Both")), discordId:v.optional(v.string()), discordUsername:v.optional(v.string()), robloxId:v.optional(v.string()), robloxUsername:v.optional(v.string()), reason:v.string(), summary:v.string(), incidentDate:v.optional(v.string()), reporterDiscordId:v.string(), reporterName:v.string(), showReporterPublicly:v.boolean(), evidenceLinks:v.array(v.string()), evidenceStorageIds:v.array(v.id("_storage")) },
  handler: async (ctx,args) => {
    assertSecret(args.adminSecret);
    if (!args.evidenceLinks.length && !args.evidenceStorageIds.length) throw new Error("Evidence is required.");
    if (args.summary.trim().length < 20 || args.summary.length > 3000) throw new Error("Incident summary must be 20–3,000 characters.");
    const now=Date.now();
    const {adminSecret,...entry}=args;
    return await ctx.db.insert("scamLogEntries",{...entry,alternateAccounts:[],status:"pending",visibility:"private",createdAt:now,updatedAt:now});
  }
});

export const adminList = query({
  args: { adminSecret:v.string(), status:v.optional(v.string()) },
  handler: async (ctx,args) => {
    assertSecret(args.adminSecret);
    const rows = args.status
      ? await ctx.db.query("scamLogEntries").withIndex("by_status_createdAt",q=>q.eq("status",args.status as any)).order("desc").take(300)
      : await ctx.db.query("scamLogEntries").order("desc").take(300);
    return rows;
  }
});

export const review = mutation({
  args: { adminSecret:v.string(), reportId:v.id("scamLogEntries"), status:v.union(v.literal("confirmed"),v.literal("rejected"),v.literal("appealed"),v.literal("hidden"),v.literal("pending")), publicNotes:v.optional(v.string()), reviewerId:v.string(), publish:v.boolean() },
  handler: async (ctx,args) => {
    assertSecret(args.adminSecret);
    const row=await ctx.db.get(args.reportId);
    if(!row) throw new Error("Scam log not found.");
    const now=Date.now();
    await ctx.db.patch(args.reportId,{status:args.status,visibility:args.publish && args.status==="confirmed" ? "public":"private",publicStaffNotes:args.publicNotes?.trim().slice(0,2000)||undefined,reviewedBy:args.reviewerId,reviewedAt:now,updatedAt:now});
    await ctx.db.insert("adminAuditLogs",{actorDiscordId:args.reviewerId,actorName:args.reviewerId,action:"scam_log_reviewed",entityType:"scamLog",entityId:String(args.reportId),reason:args.status,createdAt:now});
    return {success:true};
  }
});

export const addComment = mutation({
  args:{adminSecret:v.string(),reportId:v.id("scamLogEntries"),authorDiscordId:v.string(),authorName:v.string(),body:v.string()},
  handler:async(ctx,args)=>{
    assertSecret(args.adminSecret);
    const report=await ctx.db.get(args.reportId);
    if(!report||report.visibility!=="public"||report.status!=="confirmed") throw new Error("This report is not open for comments.");
    const body=args.body.trim();
    if(body.length<2||body.length>1000) throw new Error("Comment must be 2–1,000 characters.");
    return await ctx.db.insert("scamLogComments",{reportId:args.reportId,authorDiscordId:args.authorDiscordId,authorName:args.authorName.slice(0,100),body,status:"visible",createdAt:Date.now()});
  }
});

export const publicComments = query({
  args:{reportId:v.id("scamLogEntries")},
  handler:async(ctx,args)=>await ctx.db.query("scamLogComments").withIndex("by_report_createdAt",q=>q.eq("reportId",args.reportId)).order("asc").take(200).then(rows=>rows.filter(r=>r.status==="visible").map(({authorDiscordId,...r})=>r))
});

export const moderateComment = mutation({
  args:{adminSecret:v.string(),commentId:v.id("scamLogComments"),hide:v.boolean(),moderatorId:v.string()},
  handler:async(ctx,args)=>{
    assertSecret(args.adminSecret);
    await ctx.db.patch(args.commentId,{status:args.hide?"hidden":"visible",moderatedBy:args.moderatorId,moderatedAt:Date.now()});
    return {success:true};
  }
});
