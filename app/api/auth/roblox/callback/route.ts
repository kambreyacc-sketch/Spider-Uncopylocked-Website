import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const jar = await cookies();
  const expectedState = jar.get("roblox_oauth_state")?.value;
  const verifier = jar.get("roblox_oauth_verifier")?.value;
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const redirectUri = new URL("/api/auth/roblox/callback", request.url).toString();

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL("/marketplace?auth_error=" + encodeURIComponent(reason), request.url));
    response.cookies.delete("roblox_oauth_state");
    response.cookies.delete("roblox_oauth_verifier");
    return response;
  };

  if (oauthError) return fail("roblox_denied");
  if (!code || !returnedState || !expectedState || !safeEqual(returnedState, expectedState) || !verifier) return fail("invalid_oauth_state");
  if (!clientId || !clientSecret || !sessionSecret) return fail("missing_server_configuration");

  try {
    const tokenResponse = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail("token_exchange_failed");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return fail("missing_access_token");

    const profileResponse = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token },
      cache: "no-store",
    });
    if (!profileResponse.ok) return fail("profile_fetch_failed");
    const raw = await profileResponse.json() as Record<string, unknown>;
    const profile = {
      id: String(raw.sub ?? ""),
      username: String(raw.preferred_username ?? raw.nickname ?? ""),
      displayName: String(raw.name ?? raw.preferred_username ?? ""),
      picture: typeof raw.picture === "string" ? raw.picture : "",
    };
    if (!profile.id) return fail("profile_missing_id");

    const payload = Buffer.from(JSON.stringify({ profile, issuedAt: Date.now() })).toString("base64url");
    const session = payload + "." + sign(payload, sessionSecret);
    const response = NextResponse.redirect(new URL("/marketplace?login=success", request.url));
    const secure = request.nextUrl.protocol === "https:";
    response.cookies.set("spider_session", session, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.delete("roblox_oauth_state");
    response.cookies.delete("roblox_oauth_verifier");
    return response;
  } catch {
    return fail("oauth_unavailable");
  }
}
