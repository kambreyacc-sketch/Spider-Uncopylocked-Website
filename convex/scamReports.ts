import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const submit = mutation({
  args: { reference:v.string(), reporterDiscordId:v.string(), reportedType:v.string(), targetUrl:v.string(), reason:v.string(), details:v.string() },
  handler: async (ctx,args) => {
    if(args.reference.length>40 || args.reporterDiscordId.length>40 || args.reportedType.length>80 || args.targetUrl.length>500 || args.reason.length>120 || args.details.length<15 || args.details.length>2500) throw new Error("Please check the report details.");
    const now=Date.now();
    await ctx.db.insert("scamReports",{...args,status:"submitted",createdAt:now,updatedAt:now});
    return {reference:args.reference};
  }
});
export const mine = query({
  args:{reporterDiscordId:v.string()},
  handler:async(ctx,args)=>await ctx.db.query("scamReports").withIndex("by_reporter_createdAt",q=>q.eq("reporterDiscordId",args.reporterDiscordId)).order("desc").collect()
});
