import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
    title: v.string(), type: v.union(v.literal("Game"), v.literal("UGC Group")), robloxUrl: v.string(),
    price: v.number(), description: v.string(), imageStorageId: v.optional(v.id("_storage")), imageUrl: v.optional(v.string()),
    sellerRobloxId: v.string(), sellerName: v.string(), contactDiscord: v.optional(v.string()), contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()), status: v.union(v.literal("pending"), v.literal("active"), v.literal("rejected")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_seller", ["sellerRobloxId"]),
  resources: defineTable({
    title: v.string(), category: v.union(v.literal("Packs"),v.literal("Maps"),v.literal("Audio"),v.literal("Scripts"),v.literal("UI"),v.literal("VFX")),
    description: v.string(), tags: v.array(v.string()), platform: v.union(v.literal("Roblox"),v.literal("Discord"),v.literal("Other")),
    license: v.union(v.literal("Personal use"),v.literal("Commercial use"),v.literal("Credit required")), version: v.optional(v.string()),
    thumbnailStorageId: v.id("_storage"), previewStorageIds: v.array(v.id("_storage")), fileStorageId: v.id("_storage"),
    fileName: v.string(), fileSize: v.number(), fileLink: v.optional(v.string()), price: v.number(),
    creatorName: v.string(), creatorDiscordId: v.string(), status: v.union(v.literal("pending"),v.literal("active"),v.literal("rejected")),
    reviewReason: v.optional(v.string()), createdAt: v.number(), reviewedAt: v.optional(v.number()),
  }).index("by_status_createdAt", ["status","createdAt"]).index("by_creator_createdAt", ["creatorDiscordId","createdAt"]).index("by_creator_title", ["creatorDiscordId","title"]),
  developers: defineTable({
    username: v.string(), displayName: v.string(), discordId: v.string(), avatarUrl: v.string(), headline: v.string(), bio: v.string(),
    crafts: v.array(v.string()), skills: v.array(v.string()), services: v.array(v.object({ title: v.string(), description: v.string(), price: v.number() })),
    rateType: v.union(v.literal("hourly"), v.literal("project"), v.literal("negotiable")), rateAmount: v.optional(v.number()),
    availability: v.union(v.literal("Available"), v.literal("Busy"), v.literal("Not taking commissions")),
    portfolio: v.array(v.object({ url: v.string(), caption: v.string() })), videoUrl: v.optional(v.string()), discordUsername: v.string(), robloxUrl: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")), verified: v.boolean(), createdAt: v.number(), updatedAt: v.number(),
    reviewReason: v.optional(v.string()),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_username", ["username"]).index("by_discord", ["discordId"]),
  scamReports: defineTable({
    reference: v.string(), reporterDiscordId: v.string(), reportedType: v.string(), targetUrl: v.string(),
    reason: v.string(), details: v.string(), status: v.union(v.literal("submitted"), v.literal("pending"), v.literal("under_investigation"), v.literal("additional_information_requested"), v.literal("action_taken"), v.literal("dismissed"), v.literal("closed")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_reference", ["reference"]).index("by_reporter_createdAt", ["reporterDiscordId", "createdAt"]).index("by_status_createdAt", ["status", "createdAt"]),
  developerReports: defineTable({ developerId: v.id("developers"), reporterDiscordId: v.string(), reason: v.string(), details: v.string(), createdAt: v.number(), status: v.union(v.literal("open"), v.literal("reviewed")) }).index("by_status_createdAt", ["status", "createdAt"]),
  developerReviews: defineTable({ developerId: v.id("developers"), reviewerDiscordId: v.string(), reviewerName: v.string(), rating: v.number(), comment: v.string(), createdAt: v.number() }).index("by_developer_createdAt", ["developerId", "createdAt"]),
  jobs: defineTable({
    title: v.string(), description: v.string(), craft: v.string(), budgetMin: v.number(), budgetMax: v.number(), deadline: v.optional(v.string()),
    discordContact: v.string(), posterDiscordId: v.string(), posterName: v.string(), status: v.union(v.literal("open"), v.literal("closed")),
    createdAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"]).index("by_poster", ["posterDiscordId"]),

  studios: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    specialties: v.array(v.string()),
    ownerDiscordId: v.string(),
    ownerName: v.string(),
    ownerAvatar: v.optional(v.string()),
    robloxUrl: v.optional(v.string()),
    discordUrl: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_owner", ["ownerDiscordId"]).index("by_status_createdAt", ["status", "createdAt"]),

  conversations: defineTable({
    participantOne: v.string(),
    participantTwo: v.string(),
    participantOneName: v.string(),
    participantTwoName: v.string(),
    participantOneAvatar: v.optional(v.string()),
    participantTwoAvatar: v.optional(v.string()),
    contextType: v.optional(v.string()),
    contextTitle: v.optional(v.string()),
    lastMessageText: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_participantOne_updatedAt", ["participantOne", "updatedAt"])
    .index("by_participantTwo_updatedAt", ["participantTwo", "updatedAt"])
    .index("by_participants", ["participantOne", "participantTwo"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderDiscordId: v.string(),
    body: v.string(),
    createdAt: v.number(),
    readBy: v.array(v.string()),
  }).index("by_conversation_createdAt", ["conversationId", "createdAt"]),

  // Stripe customer mappings contain provider identifiers only; never store card numbers or CVCs.
  billingCustomers: defineTable({
    discordId: v.string(),
    stripeCustomerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_discordId", ["discordId"]).index("by_stripeCustomerId", ["stripeCustomerId"]),
  billingSubscriptions: defineTable({
    discordId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planKey: v.string(),
    priceId: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_discordId", ["discordId"]).index("by_stripeSubscriptionId", ["stripeSubscriptionId"]).index("by_stripeCustomerId", ["stripeCustomerId"]),
  billingInvoices: defineTable({
    discordId: v.string(),
    stripeCustomerId: v.string(),
    stripeInvoiceId: v.string(),
    invoiceNumber: v.optional(v.string()),
    status: v.string(),
    currency: v.string(),
    amountDue: v.number(),
    amountPaid: v.number(),
    createdAt: v.number(),
    invoicePdfUrl: v.optional(v.string()),
    hostedInvoiceUrl: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
  }).index("by_discordId", ["discordId"]).index("by_stripeInvoiceId", ["stripeInvoiceId"]),
  billingWebhookEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    processedAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  supportCounters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
  supportTickets: defineTable({
    ticketNumber: v.number(),
    category: v.union(
      v.literal("Account Appeal"),
      v.literal("Report a Scammer"),
      v.literal("Report Content"),
      v.literal("Technical Support"),
      v.literal("Studio Request"),
      v.literal("General Support")
    ),
    subject: v.string(),
    description: v.string(),
    ownerDiscordId: v.string(),
    ownerName: v.string(),
    ownerAvatar: v.optional(v.string()),
    department: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
    infractionId: v.optional(v.string()),
    status: v.union(v.literal("Open"), v.literal("In Review"), v.literal("Waiting on User"), v.literal("Escalated"), v.literal("Resolved"), v.literal("Closed")),
    priority: v.union(v.literal("Low"), v.literal("Normal"), v.literal("High"), v.literal("Urgent")),
    assignedToDiscordId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
    closedAt: v.optional(v.number()),
  }).index("by_ticketNumber", ["ticketNumber"])
    .index("by_owner_updatedAt", ["ownerDiscordId", "updatedAt"])
    .index("by_status_lastActivityAt", ["status", "lastActivityAt"])
    .index("by_assigned_lastActivityAt", ["assignedToDiscordId", "lastActivityAt"]),
  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    authorDiscordId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    body: v.string(),
    visibility: v.union(v.literal("public"), v.literal("internal")),
    kind: v.union(v.literal("reply"), v.literal("internal_note"), v.literal("system")),
    createdAt: v.number(),
  }).index("by_ticket_createdAt", ["ticketId", "createdAt"]),
  supportAuditEvents: defineTable({
    ticketId: v.id("supportTickets"),
    ticketNumber: v.number(),
    actorDiscordId: v.string(),
    actorName: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_ticket_createdAt", ["ticketId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),
  applicationCounters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
  applicationRecords: defineTable({
    applicationNumber: v.number(),
    type: v.union(
      v.literal("Studio registration"),
      v.literal("Resource / leaker upload"),
      v.literal("Marketplace posting access"),
      v.literal("Developer profile"),
      v.literal("Content creator"),
      v.literal("Discord staff role"),
      v.literal("Commission / hiring access")
    ),
    subject: v.string(),
    answers: v.any(),
    applicantDiscordId: v.string(),
    applicantName: v.string(),
    applicantAvatar: v.optional(v.string()),
    status: v.union(v.literal("Draft"), v.literal("Submitted"), v.literal("Under Review"), v.literal("Changes Requested"), v.literal("Approved"), v.literal("Rejected"), v.literal("Escalated"), v.literal("Withdrawn")),
    assignedToDiscordId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    decisionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
  }).index("by_applicationNumber", ["applicationNumber"])
    .index("by_applicant_updatedAt", ["applicantDiscordId", "updatedAt"])
    .index("by_status_updatedAt", ["status", "updatedAt"])
    .index("by_type_status_updatedAt", ["type", "status", "updatedAt"]),
  applicationEvents: defineTable({
    applicationId: v.id("applicationRecords"),
    applicationNumber: v.number(),
    actorDiscordId: v.string(),
    actorName: v.string(),
    action: v.string(),
    visibility: v.union(v.literal("applicant"), v.literal("staff")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_application_createdAt", ["applicationId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),
  moderationAuditEvents: defineTable({
    actorDiscordId: v.string(),
    actorName: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"])
});
