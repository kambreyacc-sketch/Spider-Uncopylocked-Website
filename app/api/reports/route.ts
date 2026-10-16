import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
export const runtime="nodejs";
function sessionUser(raw:string,secret:string){
 const [payload,signature]=raw.split("."); if(!payload||!signature)return null;
 const expected=createHmac("sha256",secret).update(payload).digest(); let actual:Buffer;
 try{actual=Buffer.from(signature,"base64url")}catch{return null}
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
 try{const d=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));if(d.provider!=="discord"||!d.profile?.id||!d.issuedAt||Date.now()-d.issuedAt>7*24*60*60*1000)return null;return d.profile as {id:string;username:string}}catch{return null}
}
export async function POST(request:Request){
 const secret=process.env.SESSION_SECRET, convexUrl=process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL, writeKey=process.env.ADMIN_API_SECRET || process.env.REPORT_WRITE_SECRET;
 const raw=(await cookies()).get("spider_session")?.value;
 if(!secret||!raw)return NextResponse.json({error:"Sign in with Discord before submitting a report."},{status:401});
 const user=sessionUser(raw,secret); if(!user)return NextResponse.json({error:"Your session expired. Please sign in again."},{status:401});
 if(!convexUrl||!writeKey)return NextResponse.json({error:"Report storage is not configured yet. Set NEXT_PUBLIC_CONVEX_URL and REPORT_WRITE_SECRET in Vercel and REPORT_WRITE_SECRET in Convex, then deploy the Convex schema."},{status:503});
 try{
  const body=await request.json();
  const reportedType=String(body.reportedType||"").slice(0,80),targetUrl=String(body.targetUrl||"").trim(),reason=String(body.reason||"").slice(0,120),details=String(body.details||"").trim();
  if(!reportedType||!/^https:\/\//i.test(targetUrl)||targetUrl.length>500||!reason||details.length<15||details.length>2500)return NextResponse.json({error:"Check the report type, HTTPS link, reason, and description (15–2,500 characters)."}, {status:400});
  const reference="SP-"+Date.now().toString(36).toUpperCase()+"-"+randomUUID().slice(0,6).toUpperCase();
  const client=new ConvexHttpClient(convexUrl);
  await client.mutation(api.scamReports.submit,{writeKey,reference,reporterDiscordId:user.id,reportedType,targetUrl,reason,details});
  return NextResponse.json({ok:true,reference});
 }catch{return NextResponse.json({error:"The report could not be saved. Check that the latest Convex schema and functions are deployed."},{status:503})}
}
