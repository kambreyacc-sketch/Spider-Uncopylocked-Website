import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const configuredRedirect = process.env.DISCORD_REDIRECT_URI;
  const redirectUri = configuredRedirect || new URL("/api/auth/discord/callback", origin).toString();
  if (!clientId) return NextResponse.redirect(new URL("/auth/error?reason=missing_discord_client_id", origin));
  const state = randomBytes(32).toString("base64url");
  const authorize = new URL("https://discord.com/oauth2/authorize");
  for (const [key,value] of Object.entries({client_id:clientId,redirect_uri:redirectUri,response_type:"code",scope:"identify",state})) authorize.searchParams.set(key,value);
  const response = NextResponse.redirect(authorize);
  response.cookies.set("discord_oauth_state",state,{httpOnly:true,secure:redirectUri.startsWith("https:"),sameSite:"lax",path:"/",maxAge:600});
  return response;
}
