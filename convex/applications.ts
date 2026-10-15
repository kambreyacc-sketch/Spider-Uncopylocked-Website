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
      const nextNumber = await nextApplicationNumber(ctx);
      applicationNumber = nextNumber;
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
    const rows = await ctx.db.query("applicationRecords").order("desc").take(250);
    return args.type ? rows.filter((application: any) => application.type === args.type) : rows;
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
    await ctx.db.insert("userNotifications", {
      recipientDiscordId: application.applicantDiscordId,
      category: "application",
      title: "Application #" + application.applicationNumber + " updated",
      body: args.status + (reason ? ": " + reason.slice(0, 160) : "."),
      href: "/applications/" + application.applicationNumber,
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

    // An approved developer application creates or updates the actual public profile.
    if (application.type === "Developer profile" && (args.status === "Approved" || args.status === "Rejected")) {
      const developer = await ctx.db.query("developers")
        .withIndex("by_discord", (q: any) => q.eq("discordId", application.applicantDiscordId)).unique();
      if (args.status === "Rejected") {
        if (developer) await ctx.db.patch(developer._id, { status: "rejected", reviewReason: reason, updatedAt: now });
      } else {
        const answers = (application.answers && typeof application.answers === "object" ? application.answers : {}) as Record<string, unknown>;
        const read = (key: string, max: number) => typeof answers[key] === "string" ? (answers[key] as string).trim().slice(0, max) : "";
        const username = read("username", 32).toLowerCase();
        const headline = read("headline", 120);
        const bio = read("experience", 2000);
        const roles = read("roles", 500).split(",").map(item => item.trim()).filter(Boolean).slice(0, 10);
        const skills = read("skills", 800).split(",").map(item => item.trim()).filter(Boolean).slice(0, 20);
        const portfolioUrl = read("portfolioUrl", 500);
        const portfolioAnswer = Array.isArray(answers.portfolio) ? answers.portfolio : [];
        const portfolioItems = portfolioAnswer.map((item: any) => ({
          url: typeof item?.url === "string" ? item.url.trim().slice(0, 500) : "",
          caption: typeof item?.caption === "string" ? item.caption.trim().slice(0, 120) : "",
        })).filter((item: any) => /^https:\/\//i.test(item.url)).slice(0, 9);
        const robloxUrl = read("robloxUrl", 500);
        const discordUsername = read("discordUsername", 80);
        const rateType = read("rateType", 20);
        const availability = read("availability", 40);
        const rateText = read("rateAmount", 30);
        const rateAmount = rateText ? Number(rateText) : undefined;
        const avatarUrl = read("avatarUrl", 500);
        const servicesAnswer = Array.isArray(answers.services) ? answers.services : [];
        const services = servicesAnswer.map((item: any) => ({
          title: typeof item?.title === "string" ? item.title.trim().slice(0, 80) : "",
          description: typeof item?.description === "string" ? item.description.trim().slice(0, 240) : "",
          price: typeof item?.price === "number" ? item.price : Number(item?.price),
        })).filter((item: any) => item.title && Number.isFinite(item.price) && item.price >= 0).slice(0, 12);
        if (!/^[a-z0-9_-]{3,24}$/.test(username)) throw new Error("Developer profile handle must be 3–24 letters, numbers, underscores, or hyphens.");
        if (headline.length < 3 || bio.length < 20 || roles.length === 0) throw new Error("Developer application needs a headline, experience bio, and at least one development role.");
        if (portfolioAnswer.length > 0 && (portfolioItems.length < 3 || portfolioItems.length !== portfolioAnswer.length)) throw new Error("Developer profile approval requires 3–9 valid HTTPS portfolio images.");
        if (portfolioItems.length === 0 && !/^https:\/\//i.test(portfolioUrl)) throw new Error("Submit at least three HTTPS portfolio images.");
        if (!/^https:\/\//i.test(robloxUrl) || !/roblox\.com\//i.test(robloxUrl)) throw new Error("Submit a valid HTTPS Roblox profile URL.");
        if (!discordUsername) throw new Error("Provide a Discord contact username before the developer profile can be approved.");
        if (!["hourly", "project", "negotiable"].includes(rateType)) throw new Error("Choose a valid developer pricing model.");
        if (!["Available", "Busy", "Not taking commissions"].includes(availability)) throw new Error("Choose a valid availability status.");
        if (rateAmount !== undefined && (!Number.isFinite(rateAmount) || rateAmount < 0 || rateAmount > 1000000)) throw new Error("Developer rate must be between $0 and $1,000,000.");
        if (servicesAnswer.length > 12 || servicesAnswer.some((item: any) => typeof item?.title !== "string" || item.title.trim().length === 0 || !Number.isFinite(Number(item.price)) || Number(item.price) < 0)) throw new Error("Check the submitted service titles and prices.");
        const handleOwner = await ctx.db.query("developers").withIndex("by_username", (q: any) => q.eq("username", username)).unique();
        if (handleOwner && handleOwner.discordId !== application.applicantDiscordId) throw new Error("That developer handle is already in use. Request a different handle before approving.");
        const value = {
          username,
          displayName: read("displayName", 80) || application.applicantName.slice(0, 80),
          discordId: application.applicantDiscordId,
          avatarUrl: /^https:\/\//i.test(avatarUrl) ? avatarUrl : (application.applicantAvatar || "/spider-uncopylocked-pfp.webp"),
          headline,
          bio,
          crafts: roles,
          skills,
          services,
          rateType: rateType as "hourly" | "project" | "negotiable",
          ...(rateAmount !== undefined ? { rateAmount } : {}),
          availability: availability as "Available" | "Busy" | "Not taking commissions",
          portfolio: portfolioItems.length >= 3 ? portfolioItems : [{ url: portfolioUrl, caption: "Portfolio" }],
          discordUsername,
          robloxUrl,
          status: "approved" as const,
          verified: developer?.verified ?? false,
          updatedAt: now,
          reviewReason: undefined,
        };
        if (developer) {
          await ctx.db.patch(developer._id, value);
        } else {
          await ctx.db.insert("developers", { ...value, createdAt: now });
        }
        await ctx.db.insert("moderationAuditEvents", {
          actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
          action: "developer_profile_published_from_application", targetType: "developer",
          targetId: username, details: "Application #" + application.applicationNumber, createdAt: now,
        });
      }
    }
    if (args.status === "Approved" && application.type === "Studio registration") {
      const answers = (application.answers && typeof application.answers === "object" ? application.answers : {}) as Record<string, unknown>;
      const read = (key: string, max: number) => typeof answers[key] === "string" ? (answers[key] as string).trim().slice(0, max) : "";
      const name = read("studioName", 60);
      const slug = read("slug", 32).toLowerCase();
      const description = read("description", 1200);
      const specialties = read("specialties", 500).split(",").map(item => item.trim()).filter(Boolean).slice(0, 10);
      if (name.length < 3 || !/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug) || description.length < 20 || specialties.length === 0) {
        throw new Error("Studio application is missing a valid name, handle, description, or specialty list. Request changes before approval.");
      }
      const existingStudio = await ctx.db.query("studios").withIndex("by_slug", (q: any) => q.eq("slug", slug)).unique();
      if (existingStudio && existingStudio.ownerDiscordId !== application.applicantDiscordId) {
        throw new Error("That studio handle is already in use. Request a different handle before approving.");
      }
      if (!existingStudio) {
        const robloxUrl = read("robloxUrl", 500), discordUrl = read("discordUrl", 500);
        if (robloxUrl && (!/^https:\/\//i.test(robloxUrl) || !/roblox\.com\//i.test(robloxUrl))) throw new Error("The submitted Roblox link is invalid. Request changes before approving.");
        if (discordUrl && (!/^https:\/\//i.test(discordUrl) || !/(discord\.gg|discord\.com\/invite)/i.test(discordUrl))) throw new Error("The submitted Discord link is invalid. Request changes before approving.");
        await ctx.db.insert("studios", {
          name, slug, description, specialties,
          ownerDiscordId: application.applicantDiscordId,
          ownerName: application.applicantName,
          ...(application.applicantAvatar ? { ownerAvatar: application.applicantAvatar } : {}),
          ...(robloxUrl ? { robloxUrl } : {}),
          ...(discordUrl ? { discordUrl } : {}),
          status: "active", createdAt: now, updatedAt: now,
        });
        await ctx.db.insert("moderationAuditEvents", {
          actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
          action: "studio_created_from_approved_application", targetType: "studio",
          targetId: slug, details: "Application #" + application.applicationNumber, createdAt: now,
        });
      }
    }

    if (args.status === "Approved" && application.type === "Discord staff role") {
      const answers = (application.answers && typeof application.answers === "object" ? application.answers : {}) as Record<string, unknown>;
      const requestedRole = typeof answers.role === "string" ? answers.role.trim() : "";
      const allowedRoles: Record<string, string> = {
        "Support Staff": "support",
        "Reviewer": "review",
        "Moderator": "moderate",
        "Senior Moderator": "moderation_manage",
        "Management": "staff_manage",
      };
      const roleKey = allowedRoles[requestedRole];
      if (!roleKey) throw new Error("This staff role is not eligible for application-based approval. Owner/Admin roles can only be configured by the repository owner.");
      const existingGrant = await ctx.db.query("websiteRoleGrants")
        .withIndex("by_discordId_roleKey", (q: any) => q.eq("discordId", application.applicantDiscordId).eq("roleKey", roleKey)).unique();
      if (existingGrant) {
        await ctx.db.patch(existingGrant._id, {
          active: true, grantedByDiscordId: args.actorDiscordId, grantedByName: args.actorName.slice(0, 100),
          applicationNumber: application.applicationNumber, updatedAt: now,
        });
      } else {
        await ctx.db.insert("websiteRoleGrants", {
          discordId: application.applicantDiscordId, roleKey,
          grantedByDiscordId: args.actorDiscordId, grantedByName: args.actorName.slice(0, 100),
          applicationNumber: application.applicationNumber, active: true, createdAt: now, updatedAt: now,
        });
      }
      await ctx.db.insert("moderationAuditEvents", {
        actorDiscordId: args.actorDiscordId, actorName: args.actorName.slice(0, 100),
        action: "staff_role_granted_from_approved_application", targetType: "member_role",
        targetId: application.applicantDiscordId, details: requestedRole + " · Application #" + application.applicationNumber, createdAt: now,
      });
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
