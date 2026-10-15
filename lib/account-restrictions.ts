import { api } from "../convex/_generated/api";
import { getServiceConvex } from "./service-convex";

export type RestrictedAction = "apply" | "upload" | "publish" | "message" | "browse" | "support";
export type RestrictionDecision =
  | { status: "clear" }
  | { status: "unavailable" }
  | { status: "blocked"; kind: "Warning" | "Restricted" | "Suspended" | "Banned"; reason: string; expiresAt: number | null };

const blockedByKind: Record<Exclude<RestrictionDecision, {status:"clear"|"unavailable"}>["kind"], RestrictedAction[]> = {
  Warning: [],
  Restricted: ["apply", "upload", "publish", "message"],
  Suspended: ["apply", "upload", "publish", "message", "browse"],
  Banned: ["apply", "upload", "publish", "message", "browse"],
};

/** Checks the persistent moderation source of truth. A failed lookup is not treated as proof of access. */
export async function checkAccountRestriction(discordId: string, action: RestrictedAction): Promise<RestrictionDecision> {
  const db = getServiceConvex();
  if (!db) return { status: "unavailable" };
  try {
    const restriction = await db.client.query(api.admin.getActiveRestriction, {
      adminSecret: db.secret,
      subjectDiscordId: discordId,
    });
    if (!restriction || !blockedByKind[restriction.kind as keyof typeof blockedByKind]?.includes(action)) {
      return { status: "clear" };
    }
    return {
      status: "blocked",
      kind: restriction.kind as "Restricted" | "Suspended" | "Banned" | "Warning",
      reason: restriction.reason,
      expiresAt: restriction.expiresAt,
    };
  } catch (error) {
    console.error("Account restriction lookup failed:", error);
    return { status: "unavailable" };
  }
}
