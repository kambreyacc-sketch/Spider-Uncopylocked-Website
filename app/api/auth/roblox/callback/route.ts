import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export async function GET(request:NextRequest){
 const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state");
 const jar=await cookies(),expected=jar.get("roblox_oauth_state")?.value,verifier=jar.get("roblox_oauth_verifier")?.value;
 const clientId=process.env.ROBLOX_CLIENT_ID,clientSecret=process.env.ROBLOX_CLIENT_SECRET,sessionSecret=process.env.SESSION_SECRET;
 const redirectUri=new URL("/api/auth/roblox/callback",request.url).toString();
 const fail=(reason:string)=>{const r=NextResponse.redirect(new URL("/marketplace?auth_error="+encodeURIComponent(reason),request.url));r.cookies.delete("roblox_oauth_state");r.cookies.delete("roblox_oauth_verifier");return r};
 if(url.searchParams.has("error"))return fail("roblox_denied");
 if(!code||!state||!expected||!equal(state,expected)||!verifier)return fail("invalid_oauth_state");
 if(!clientId||!clientSecret||!sessionSecret)return fail("missing_server_configuration");
 try{
  const tokenRes=await fetch("https://apis.roblox.com/oauth/v1/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,code_verifier:verifier}),cache:"no-store"});
  if(!tokenRes.ok)return fail("token_exchange_failed");
  const token=await tokenRes.json() as {access_token?:string};if(!token.access_token)return fail("missing_access_token");
  const profileRes=await fetch("https://apis.roblox.com/oauth/v1/userinfo",{headers:{Authorization:"Bearer "+token.access_token},cache:"no-store"});
  if(!profileRes.ok)return fail("profile_fetch_failed");
  const p=await profileRes.json() as Record<string,unknown>;
  const profile={id:String(p.sub??""),username:String(p.preferred_username??p.nickname??""),displayName:String(p.name??p.preferred_username??""),picture:typeof p.picture==="string"?p.picture:""};
  if(!profile.id)return fail("profile_missing_id");
  const payload=Buffer.from(JSON.stringify({profile,issuedAt:Date.now()})).toString("base64url");
  const sig=createHmac("sha256",sessionSecret).update(payload).digest("base64url");
  const response=NextResponse.redirect(new URL("/marketplace?login=success",request.url));
  response.cookies.set("spider_session",payload+"."+sig,{httpOnly:true,secure:request.nextUrl.protocol==="https:",sameSite:"lax",path:"/",maxAge:604800});
  response.cookies.delete("roblox_oauth_state");response.cookies.delete("roblox_oauth_verifier");return response;
 }catch{return fail("oauth_unavailable")}
}
