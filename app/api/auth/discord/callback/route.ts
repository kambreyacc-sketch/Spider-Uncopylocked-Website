import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export async function GET(request:NextRequest){
 const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state");
 const jar=await cookies(),expected=jar.get("discord_oauth_state")?.value;
 const clientId=process.env.DISCORD_CLIENT_ID,clientSecret=process.env.DISCORD_CLIENT_SECRET,sessionSecret=process.env.SESSION_SECRET;
 const origin=process.env.NEXT_PUBLIC_SITE_URL||url.origin;
 const redirectUri=process.env.DISCORD_REDIRECT_URI||new URL("/api/auth/discord/callback",origin).toString();
 const fail=(reason:string)=>{const r=NextResponse.redirect(new URL("/auth/error?reason="+encodeURIComponent(reason),origin));r.cookies.delete("discord_oauth_state");return r};
 if(url.searchParams.has("error"))return fail("discord_denied");
 if(!code||!state||!expected||!equal(state,expected))return fail("invalid_discord_oauth_state");
 if(!clientId||!clientSecret||!sessionSecret)return fail("missing_server_configuration");
 try{
  const tokenRes=await fetch("https://discord.com/api/oauth2/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:"authorization_code",code,redirect_uri:redirectUri}),cache:"no-store"});
  if(!tokenRes.ok)return fail("discord_token_exchange_failed");
  const token=await tokenRes.json() as {access_token?:string};if(!token.access_token)return fail("missing_access_token");
  const profileRes=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:"Bearer "+token.access_token},cache:"no-store"});
  if(!profileRes.ok)return fail("discord_profile_fetch_failed");
  const p=await profileRes.json() as {id?:string;username?:string;global_name?:string;avatar?:string|null};
  if(!p.id||!p.username)return fail("discord_profile_missing");
  const profile={id:p.id,username:p.username,displayName:p.global_name||p.username,avatar:p.avatar?"https://cdn.discordapp.com/avatars/"+p.id+"/"+p.avatar+".png":""};
  const payload=Buffer.from(JSON.stringify({provider:"discord",profile,issuedAt:Date.now()})).toString("base64url");
  const sig=createHmac("sha256",sessionSecret).update(payload).digest("base64url");
  const response=NextResponse.redirect(new URL("/?login=discord_success",origin));
  response.cookies.set("spider_session",payload+"."+sig,{httpOnly:true,secure:origin.startsWith("https:"),sameSite:"lax",path:"/",maxAge:604800});
  response.cookies.delete("discord_oauth_state");return response;
 }catch{return fail("discord_oauth_unavailable")}
}
