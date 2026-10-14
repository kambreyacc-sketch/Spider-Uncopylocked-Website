import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSpiderProfile } from "@/lib/session";
import {
  checkVipGamePassOwnership,
  VIP_ACCESS_COOKIE,
  VIP_ACCESS_TTL_SECONDS,
  VIP_CHALLENGE_COOKIE,
  VIP_GAME_PASS_ID,
  type VipChallenge,
  type VipMembership,
  readVipClaim,
  signVipClaim,
} from "@/lib/vip";

export const runtime = "nodejs";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return response(
      { error: "This request must come from Spider Uncopylocked." },
      403,
    );
  }

  const profile = await getSpiderProfile();
  if (!profile) {
    return response(
      {
        code: "discord_login_required",
        error: "Sign in with Discord before activating VIP.",
      },
      401,
    );
  }
  if (!process.env.SESSION_SECRET) {
    return response(
      { error: "VIP verification is not configured on this deployment yet." },
      503,
    );
  }

  const jar = await cookies();
  const challenge = readVipClaim<VipChallenge>(
    jar.get(VIP_CHALLENGE_COOKIE)?.value,
  );
  if (
    !challenge ||
    challenge.discordId !== profile.id ||
    challenge.expiresAt <= Date.now() ||
    !challenge.robloxUserId ||
    !challenge.robloxUsername ||
    !challenge.code
  ) {
    return response(
      {
        code: "challenge_expired",
        error:
          "Your verification code expired. Generate a fresh code and try again.",
      },
      400,
    );
  }

  let robloxProfile: { id?: number; name?: string; description?: string };
  try {
    const profileResponse = await fetch(
      "https://users.roblox.com/v1/users/" +
        encodeURIComponent(challenge.robloxUserId),
      { cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (profileResponse.status === 404) {
      return response(
        {
          error:
            "We couldn't find that Roblox profile anymore. Generate a new code.",
        },
        404,
      );
    }
    if (!profileResponse.ok) {
      return response(
        {
          error:
            "Roblox couldn't verify the profile bio right now. Please retry shortly.",
        },
        503,
      );
    }
    robloxProfile = (await profileResponse.json()) as {
      id?: number;
      name?: string;
      description?: string;
    };
  } catch {
    return response(
      {
        error:
          "Roblox couldn't verify the profile bio right now. Please retry shortly.",
      },
      503,
    );
  }

  if (String(robloxProfile.id) !== challenge.robloxUserId) {
    return response(
      {
        error:
          "The profile returned by Roblox did not match the account you selected.",
      },
      400,
    );
  }
  const bio = (robloxProfile.description || "").toUpperCase();
  if (!bio.includes(challenge.code.toUpperCase())) {
    return response(
      {
        code: "bio_code_missing",
        error:
          "We couldn't find " +
          challenge.code +
          " in @" +
          challenge.robloxUsername +
          "'s public About section yet. Save the code in your bio, then try again.",
      },
      400,
    );
  }

  const ownsPass = await checkVipGamePassOwnership(challenge.robloxUserId);
  if (ownsPass === "unavailable") {
    return response(
      {
        code: "ownership_check_unavailable",
        error:
          "Roblox's game-pass ownership service is unavailable. Your code is safe; wait a moment and try again.",
      },
      503,
    );
  }
  if (ownsPass === "not_owned") {
    return response(
      {
        code: "pass_not_owned",
        error:
          "Your Roblox bio code is correct, but Roblox doesn't report ownership of the VIP game pass on that account yet. Finish the purchase on Roblox and retry.",
      },
      403,
    );
  }

  const now = Date.now();
  const membership: VipMembership = {
    discordId: profile.id,
    robloxUserId: challenge.robloxUserId,
    robloxUsername: challenge.robloxUsername,
    gamePassId: VIP_GAME_PASS_ID,
    verifiedAt: now,
    expiresAt: now + VIP_ACCESS_TTL_SECONDS * 1000,
  };
  const signed = signVipClaim(membership);
  const next = response({
    ok: true,
    vipActive: true,
    membership: {
      robloxUsername: membership.robloxUsername,
      robloxUserId: membership.robloxUserId,
      verifiedAt: membership.verifiedAt,
      expiresAt: membership.expiresAt,
    },
  });
  next.cookies.set(VIP_ACCESS_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VIP_ACCESS_TTL_SECONDS,
  });
  next.cookies.set(VIP_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return next;
}
