import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/marketplace?auth_error=missing_client_id", request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = new URL("/api/auth/roblox/callback", request.url).toString();

  const authorize = new URL("https://apis.roblox.com/oauth/v1/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "openid profile");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorize);
  const secure = new URL(request.url).protocol === "https:";
  response.cookies.set("roblox_oauth_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  response.cookies.set("roblox_oauth_verifier", verifier, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
