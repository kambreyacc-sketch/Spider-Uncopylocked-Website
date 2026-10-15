import { api } from "../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin, type SpiderProfile } from "./session";
import { getServiceConvex } from "./service-convex";

export type StaffCapability =
  | "support.view" | "support.reply" | "support.manage"
  | "applications.view" | "applications.review"
  | "content.view" | "content.review"
  | "reports.view" | "reports.review"
  | "restrictions.view" | "restrictions.manage"
  | "roles.view";

export async function hasStaffCapability(capability: StaffCapability, profile?: SpiderProfile | null): Promise<boolean> {
  if (await isSpiderAdmin()) return true;
  const user = profile === undefined ? await getSpiderProfile() : profile;
  if (!user) return false;
  const db = getServiceConvex();
  if (!db) return false;
  try {
    const capabilities = await db.client.query(api.roles.capabilitiesForMember, { adminSecret: db.secret, discordId: user.id });
    return capabilities.includes(capability);
  } catch (error) {
    console.error("Staff capability lookup failed:", error);
    return false;
  }
}
