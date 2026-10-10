import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/marketplace?auth_error=missing_discord_client_id", request.url));
  const state = randomBytes(32).toString("base64url");
  const redirectUri = new URL("/api/auth/discord/callback", request.url).toString();
  const authorize = new URL("https://discord.com/oauth2/authorize");
  for (const [key,value] of Object.entries({client_id:clientId,redirect_uri:redirectUri,response_type:"code",scope:"identify",state})) authorize.searchParams.set(key,value);
  const response = NextResponse.redirect(authorize);
  response.cookies.set("discord_oauth_state",state,{httpOnly:true,secure:new URL(request.url).protocol==="https:",sameSite:"lax",path:"/",maxAge:600});
  return response;
}
