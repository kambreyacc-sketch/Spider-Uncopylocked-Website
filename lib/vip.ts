import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSpiderProfile, type SpiderProfile } from "./session";

export const VIP_GAME_PASS_ID = "1759776349";
export const VIP_GAME_PASS_URL =
  "https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED";
export const VIP_CHALLENGE_COOKIE = "spider_vip_challenge";
export const VIP_ACCESS_COOKIE = "spider_vip_access";
export const VIP_CHALLENGE_TTL_SECONDS = 20 * 60;
export const VIP_ACCESS_TTL_SECONDS = 30 * 24 * 60 * 60;

export type VipChallenge = {
  discordId: string;
  robloxUserId: string;
  robloxUsername: string;
  code: string;
  issuedAt: number;
  expiresAt: number;
};

export type VipMembership = {
  discordId: string;
  robloxUserId: string;
  robloxUsername: string;
  gamePassId: string;
  verifiedAt: number;
  expiresAt: number;
};

function sessionSecret() {
  return process.env.SESSION_SECRET || "";
}

export function signVipClaim<T extends object>(claim: T): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return payload + "." + signature;
}

export function readVipClaim<T>(raw: string | undefined | null): T | null {
  const secret = sessionSecret();
  if (!secret || !raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function getVipMembership(
  profile?: SpiderProfile | null,
): Promise<VipMembership | null> {
  const signedInUser =
    profile === undefined ? await getSpiderProfile() : profile;
  if (!signedInUser || !sessionSecret()) return null;

  const raw = (await cookies()).get(VIP_ACCESS_COOKIE)?.value;
  const claim = readVipClaim<VipMembership>(raw);
  if (
    !claim ||
    claim.discordId !== signedInUser.id ||
    claim.gamePassId !== VIP_GAME_PASS_ID ||
    !claim.robloxUserId ||
    !claim.robloxUsername ||
    !Number.isFinite(claim.expiresAt) ||
    claim.expiresAt <= Date.now()
  ) {
    return null;
  }
  return claim;
}

export async function checkVipGamePassOwnership(
  robloxUserId: string,
): Promise<"owned" | "not_owned" | "unavailable"> {
  if (!/^\d{1,20}$/.test(robloxUserId)) return "unavailable";
  try {
    const response = await fetch(
      "https://inventory.roblox.com/v1/users/" +
        encodeURIComponent(robloxUserId) +
        "/items/GamePass/" +
        VIP_GAME_PASS_ID +
        "/is-owned",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent":
            "SpiderUncopylocked/1.0 (+https://spider-uncopylocked-website.vercel.app)",
        },
      },
    );
    if (!response.ok) return "unavailable";
    const result = (await response.text())
      .trim()
      .replace(/^"|"$/g, "")
      .toLowerCase();
    if (result === "true") return "owned";
    if (result === "false") return "not_owned";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
