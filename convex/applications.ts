import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const applicationType = v.union(
  v.literal("Studio registration"),
  v.literal("Resource / leaker upload"),
  v.literal("Marketplace posting access"),
  v.literal("Developer profile"),
  v.literal("Content creator"),
  v.literal("Discord staff role"),
  v.literal("Commission / hiring access"),
);
const applicationStatus = v.union(
  v.literal("Draft"),
  v.literal("Submitted"),
  v.literal("Under Review"),
  v.literal("Changes Requested"),
  v.literal("Approved"),
  v.literal("Rejected"),
  v.literal("Escalated"),
  v.literal("Withdrawn"),
);

function assertServiceSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized application service request.");
  }
}

async function nextApplicationNumber(ctx: any) {
  const row = await ctx.db.query("applicationCounters").withIndex("by_name", (q: any) => q.eq("name", "applications")).unique();
  if (!row) {
    await ctx.db.insert("applicationCounters", { name: "applications", value: 2000 });
    return 2001;
  }
  const value = row.value + 1;
  await ctx.db.patch(row._id, { value });
  return value;
}

function validatePayload(subject: string, answers: unknown) {
  const trimmed = subject.trim();
  if (trimmed.length < 4 || trimmed.length > 120) throw new Error("Application title must be 4–120 characters.");
  let encoded = "";
  try { encoded = JSON.stringify(answers ?? {}); } catch { throw new Error("Application answers are invalid."); }
  if (encoded.length > 20000) throw new Error("Application is too large. Keep answers under 20,000 characters.");
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("Application answers must be an object.");
  return { subject: trimmed, answers: JSON.parse(encoded) };
}

export const submit = mutation({
  args: {
    adminSecret: v.string(),
    applicationNumber: v.optional(v.number()),
    type: applicationType,
    subject: v.string(),
    answers: v.any(),
    applicantDiscordId: v.string(),
    applicantName: v.string(),
    applicantAvatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const validated = validatePayload(args.subject, args.answers);
    if (!args.applicantDiscordId.trim()) throw new Error("Sign in with Discord before submitting.");
    const now = Date.now();
    const existing = await ctx.db.query("applicationRecords")
      .withIndex("by_applicant_updatedAt", (q: any) => q.eq("applicantDiscordId", args.applicantDiscordId))
      .order("desc").take(30);
    const duplicate = existing.find((a: any) =>
      a.type === args.type &&
      ["Submitted", "Under Review", "Changes Requested"].includes(a.status)
    );
    if (duplicate) throw new Error("You already have an active application of this type. Open your application history to review it.");
    if (existing.filter((a: any) => now - a.createdAt < 24 * 60 * 60 * 1000 && a.status !== "Draft").length >= 4) {
      throw new Error("You have reached the application limit for today. Please try again later.");
    }
    if (args.applicationNumber !== undefined) {
      const draft = await ctx.db.query("applicationRecords").withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", args.applicationNumber)).unique();
      if (!draft || draft.applicantDiscordId !== args.applicantDiscordId || draft.status !== "Draft" || draft.type !== args.type) throw new Error("Draft not found or it can no longer be submitted.");
      const updated = { ...validated, status: "Submitted" as const, submittedAt: now, updatedAt: now, applicantName: args.applicantName.trim().slice(0,100), ...(args.applicantAvatar ? { applicantAvatar: args.applicantAvatar } : {}) };
      await ctx.db.patch(draft._id, updated);
      await ctx.db.insert("applicationEvents", { applicationId: draft._id, applicationNumber: draft.applicationNumber, actorDiscordId: args.applicantDiscordId, actorName: args.applicantName.trim().slice(0,100), action: "application_submitted", visibility: "applicant", createdAt: now });
      return { success: true, applicationNumber: draft.applicationNumber };
    }
    const applicationNumber = await nextApplicationNumber(ctx);
    const applicationId = await ctx.db.insert("applicationRecords", {
      applicationNumber,
      type: args.type,
      subject: validated.subject,
      answers: validated.answers,
      applicantDiscordId: args.applicantDiscordId,
      applicantName: args.applicantName.trim().slice(0, 100),
      ...(args.applicantAvatar ? { applicantAvatar: args.applicantAvatar } : {}),
      status: "Submitted",
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    });
    await ctx.db.insert("applicationEvents", {
      applicationId, applicationNumber, actorDiscordId: args.applicantDiscordId,
      actorName: args.applicantName.trim().slice(0, 100), action: "application_submitted",
      visibility: "applicant", createdAt: now,
    });
    return { success: true, applicationNumber };
  },
});


export const saveDraft = mutation({
  args: {
    adminSecret: v.string(),
    applicationNumber: v.optional(v.number()),
    type: applicationType,
    subject: v.string(),
    answers: v.any(),
    applicantDiscordId: v.string(),
    applicantName: v.string(),
    applicantAvatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const validated = validatePayload(args.subject, args.answers);
    if (!args.applicantDiscordId.trim()) throw new Error("Sign in with Discord before saving a draft.");
    const now = Date.now();
    let applicationNumber = args.applicationNumber;
    let applicationId: any;
    if (applicationNumber !== undefined) {
      const existing = await ctx.db.query("applicationRecords").withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", applicationNumber)).unique();
      if (!existing || existing.applicantDiscordId !== args.applicantDiscordId || existing.status !== "Draft" || existing.type !== args.type) throw new Error("Draft not found or it can no longer be edited.");
      applicationId = existing._id;
      await ctx.db.patch(existing._id, {
        ...validated, answers: validated.answers, updatedAt: now,
        applicantName: args.applicantName.trim().slice(0, 100),
        ...(args.applicantAvatar ? { applicantAvatar: args.applicantAvatar } : {}),
      });
    } else {
      applicationNumber = await nextApplicationNumber(ctx);
      applicationId = const nextNumber = applicationNumber = await nextApplicationNumber(ctx);
      applicationId = await ctx.db.insert("applicationRecords", {
        applicationNumber: nextNumber, type: args.type, ...validated,
        applicantDiscordId: args.applicantDiscordId,
        applicantName: args.applicantName.trim().slice(0, 100),
        ...(args.applicantAvatar ? { applicantAvatar: args.applicantAvatar } : {}),
        status: "Draft", createdAt: now, updatedAt: now,
      });
    }
    await ctx.db.insert("applicationEvents", {
      applicationId, applicationNumber, actorDiscordId: args.applicantDiscordId,
      actorName: args.applicantName.trim().slice(0, 100), action: "draft_saved",
      visibility: "applicant", createdAt: now,
    });
    return { success: true, applicationNumber };
  },
});

export const listMine = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    return await ctx.db.query("applicationRecords")
      .withIndex("by_applicant_updatedAt", (q: any) => q.eq("applicantDiscordId", args.applicantDiscordId))
      .order("desc").take(100);
  },
});

export const getMine = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string(), applicationNumber: v.number() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const application = await ctx.db.query("applicationRecords")
      .withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", args.applicationNumber)).unique();
    if (!application || application.applicantDiscordId !== args.applicantDiscordId) return null;
    const events = await ctx.db.query("applicationEvents")
      .withIndex("by_application_createdAt", (q: any) => q.eq("applicationId", application._id))
      .order("asc").collect();
    return { application, events: events.filter((e: any) => e.visibility === "applicant").map((e: any) => ({ action: e.action, note: e.note, createdAt: e.createdAt })) };
  },
});

export const listForStaff = query({
  args: { adminSecret: v.string(), status: v.optional(applicationStatus), type: v.optional(applicationType) },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    if (args.status && args.type) {
      return await ctx.db.query("applicationRecords")
        .withIndex("by_type_status_updatedAt", (q: any) => q.eq("type", args.type).eq("status", args.status))
        .order("desc").take(250);
    }
    if (args.status) {
      return await ctx.db.query("applicationRecords")
        .withIndex("by_status_updatedAt", (q: any) => q.eq("status", args.status))
        .order("desc").take(250);
    }
    return await ctx.db.query("applicationRecords").order("desc").take(250);
  },
});

export const getForStaff = query({
  args: { adminSecret: v.string(), applicationNumber: v.number() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const application = await ctx.db.query("applicationRecords")
      .withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", args.applicationNumber)).unique();
    if (!application) return null;
    const events = await ctx.db.query("applicationEvents")
      .withIndex("by_application_createdAt", (q: any) => q.eq("applicationId", application._id))
      .order("asc").collect();
    return { application, events };
  },
});

export const review = mutation({
  args: {
    adminSecret: v.string(),
    applicationNumber: v.number(),
    actorDiscordId: v.string(),
    actorName: v.string(),
    status: v.union(v.literal("Under Review"), v.literal("Changes Requested"), v.literal("Approved"), v.literal("Rejected"), v.literal("Escalated")),
    decisionReason: v.optional(v.string()),
    assignedToDiscordId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    staffNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const application = await ctx.db.query("applicationRecords")
      .withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", args.applicationNumber)).unique();
    if (!application) throw new Error("Application not found.");
    const reason = args.decisionReason?.trim();
    if (["Rejected", "Changes Requested"].includes(args.status) && (!reason || reason.length < 3 || reason.length > 2000)) {
      throw new Error("Provide a reason between 3 and 2,000 characters for this decision.");
    }
    if (args.staffNote && args.staffNote.length > 4000) throw new Error("Private staff note is limited to 4,000 characters.");
    const now = Date.now();
    const patch: any = { status: args.status, updatedAt: now, reviewedAt: now, decisionReason: reason || undefined };
    if (args.assignedToDiscordId !== undefined) {
      if (args.assignedToDiscordId.trim()) {
        patch.assignedToDiscordId = args.assignedToDiscordId.trim();
        patch.assignedToName = (args.assignedToName || args.assignedToDiscordId).slice(0, 100);
      } else {
        patch.assignedToDiscordId = undefined;
        patch.assignedToName = undefined;
      }
    }
    await ctx.db.patch(application._id, patch);
    await ctx.db.insert("applicationEvents", {
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      actorDiscordId: args.actorDiscordId,
      actorName: args.actorName.slice(0, 100),
      action: "status_changed",
      visibility: "applicant",
      note: ["Rejected", "Changes Requested"].includes(args.status) ? reason : "Your application status is now " + args.status + ".",
      createdAt: now,
    });
    if (args.staffNote?.trim()) {
      await ctx.db.insert("applicationEvents", {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        actorDiscordId: args.actorDiscordId,
        actorName: args.actorName.slice(0, 100),
        action: "internal_note",
        visibility: "staff",
        note: args.staffNote.trim(),
        createdAt: now,
      });
    }
    await ctx.db.insert("moderationAuditEvents", {
      actorDiscordId: args.actorDiscordId,
      actorName: args.actorName.slice(0, 100),
      action: "application_" + args.status.toLowerCase().replaceAll(" ", "_"),
      targetType: "application",
      targetId: String(application.applicationNumber),
      details: reason,
      createdAt: now,
    });

    // Keep the pre-existing developer directory consistent with its approval state.
    if (application.type === "Developer profile" && (args.status === "Approved" || args.status === "Rejected")) {
      const developer = await ctx.db.query("developers")
        .withIndex("by_discord", (q: any) => q.eq("discordId", application.applicantDiscordId)).unique();
      if (developer) {
        await ctx.db.patch(developer._id, {
          status: args.status === "Approved" ? "approved" : "rejected",
          reviewReason: args.status === "Rejected" ? reason : undefined,
          updatedAt: now,
        });
      }
    }
    return { success: true, applicationNumber: application.applicationNumber, status: args.status };
  },
});

export const withdraw = mutation({
  args: { adminSecret: v.string(), applicationNumber: v.number(), applicantDiscordId: v.string() },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const application = await ctx.db.query("applicationRecords")
      .withIndex("by_applicationNumber", (q: any) => q.eq("applicationNumber", args.applicationNumber)).unique();
    if (!application || application.applicantDiscordId !== args.applicantDiscordId) throw new Error("Application not found.");
    if (!["Draft", "Submitted", "Changes Requested"].includes(application.status)) throw new Error("This application can no longer be withdrawn.");
    const now = Date.now();
    await ctx.db.patch(application._id, { status: "Withdrawn", updatedAt: now });
    await ctx.db.insert("applicationEvents", { applicationId: application._id, applicationNumber: application.applicationNumber, actorDiscordId: args.applicantDiscordId, actorName: application.applicantName, action: "application_withdrawn", visibility: "applicant", createdAt: now });
    return { success: true };
  },
});

export const hasApprovedAccess = query({
  args: { adminSecret: v.string(), applicantDiscordId: v.string(), type: applicationType },
  handler: async (ctx, args) => {
    assertServiceSecret(args.adminSecret);
    const approved = await ctx.db.query("applicationRecords")
      .withIndex("by_applicant_type_status", (q: any) => q.eq("applicantDiscordId", args.applicantDiscordId).eq("type", args.type).eq("status", "Approved"))
      .first();
    return !!approved;
  },
});
