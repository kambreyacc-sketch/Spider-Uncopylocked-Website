import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSpiderProfile } from "@/lib/session";
import {
  VIP_CHALLENGE_COOKIE,
  VIP_CHALLENGE_TTL_SECONDS,
  type VipChallenge,
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

  let username = "";
  try {
    const body = (await request.json()) as { username?: unknown };
    username = typeof body.username === "string" ? body.username.trim() : "";
  } catch {
    return response(
      { error: "Enter your Roblox username and try again." },
      400,
    );
  }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return response(
      {
        error:
          "Enter a valid Roblox username (3–20 letters, numbers, or underscores).",
      },
      400,
    );
  }

  try {
    const lookup = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    });
    if (!lookup.ok) {
      return response(
        {
          error:
            "Roblox could not be reached right now. Please try again in a moment.",
        },
        503,
      );
    }
    const data = (await lookup.json()) as {
      data?: Array<{ id: number; name: string; displayName: string }>;
    };
    const account = data.data?.[0];
    if (!account || !Number.isFinite(account.id)) {
      return response(
        {
          error:
            "We couldn't find that Roblox username. Check the spelling and try again.",
        },
        404,
      );
    }

    const now = Date.now();
    const code = "SPIDER-VIP-" + randomBytes(4).toString("hex").toUpperCase();
    const challenge: VipChallenge = {
      discordId: profile.id,
      robloxUserId: String(account.id),
      robloxUsername: account.name,
      code,
      issuedAt: now,
      expiresAt: now + VIP_CHALLENGE_TTL_SECONDS * 1000,
    };
    const signed = signVipClaim(challenge);
    const jar = await cookies();
    jar.set(VIP_CHALLENGE_COOKIE, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VIP_CHALLENGE_TTL_SECONDS,
    });

    return response({
      ok: true,
      code,
      username: account.name,
      displayName: account.displayName,
      robloxUserId: String(account.id),
      profileUrl: "https://www.roblox.com/users/" + account.id + "/profile",
      expiresAt: challenge.expiresAt,
    });
  } catch {
    return response(
      {
        error:
          "Roblox verification is temporarily unavailable. Please try again.",
      },
      503,
    );
  }
}
