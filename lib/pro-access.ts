import { api } from "../convex/_generated/api";
import { getBillingDb } from "./stripe";
import type { SpiderProfile } from "./session";

export type SpiderProEntitlement = {
  premium: boolean;
  planKey: string;
  status: "active" | "free" | "unavailable" | "unauthenticated" | string;
  renewalDate: number | null;
  cancelAtPeriodEnd: boolean;
};

/**
 * Fail-closed Pro entitlement check for server components and protected routes.
 * Only a verified active/trialing Stripe subscription recorded by the signed
 * webhook pipeline can grant Pro. This never starts a checkout or charges a user.
 */
export async function getSpiderProEntitlement(
  profile: SpiderProfile | null,
): Promise<SpiderProEntitlement> {
  if (!profile) {
    return {
      premium: false,
      planKey: "free",
      status: "unauthenticated",
      renewalDate: null,
      cancelAtPeriodEnd: false,
    };
  }

  const db = getBillingDb();
  if (!db) {
    return {
      premium: false,
      planKey: "free",
      status: "unavailable",
      renewalDate: null,
      cancelAtPeriodEnd: false,
    };
  }

  try {
    const result = await db.client.query(api.billing.getEntitlement, {
      adminSecret: db.secret,
      discordId: profile.id,
    });
    return {
      premium: result.premium === true,
      planKey: typeof result.planKey === "string" ? result.planKey : "free",
      status: typeof result.status === "string" ? result.status : "free",
      renewalDate:
        typeof result.renewalDate === "number" ? result.renewalDate : null,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd === true,
    };
  } catch (error) {
    console.error("Spider Pro entitlement lookup failed:", error);
    return {
      premium: false,
      planKey: "free",
      status: "unavailable",
      renewalDate: null,
      cancelAtPeriodEnd: false,
    };
  }
}

export async function hasSpiderProAccess(
  profile: SpiderProfile | null,
): Promise<boolean> {
  const entitlement = await getSpiderProEntitlement(profile);
  return entitlement.premium;
}
