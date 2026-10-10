import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
 const secret=process.env.SESSION_SECRET;
 const raw=(await cookies()).get("spider_session")?.value;
 if(!secret||!raw)return NextResponse.json({user:null},{status:200});
 const [payload,signature]=raw.split(".");
 if(!payload||!signature)return NextResponse.json({user:null});
 const expected=createHmac("sha256",secret).update(payload).digest();
 let actual:Buffer;
 try{actual=Buffer.from(signature,"base64url")}catch{return NextResponse.json({user:null})}
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return NextResponse.json({user:null});
 try{
  const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {provider?:string;profile?:{id?:string;username?:string;displayName?:string;avatar?:string};issuedAt?:number};
  if(data.provider!=="discord"||!data.profile?.id||!data.profile.username||!data.issuedAt||Date.now()-data.issuedAt>7*24*60*60*1000)return NextResponse.json({user:null});
  return NextResponse.json({user:data.profile});
 }catch{return NextResponse.json({user:null})}
}