import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config(){const url=process.env.NEXT_PUBLIC_CONVEX_URL||process.env.CONVEX_URL;const secret=(process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);return url&&secret?{url,secret}:null;}
export async function GET(){
 const user=await getSpiderProfile();
 if(!user)return NextResponse.json({error:"Sign in with Discord to view your profile."},{status:401});
 const cfg=config();if(!cfg)return NextResponse.json({error:"Profile service is not configured."},{status:503});
 try{const profiles=await new ConvexHttpClient(cfg.url).query(api.admin.getDeveloperProfileForUser,{adminSecret:cfg.secret,discordId:user.id});return NextResponse.json({profiles},{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){console.error("Own developer profile lookup failed:",error);return NextResponse.json({error:"Could not load your profile."},{status:502})}
}
export async function POST(request:Request){
 const user=await getSpiderProfile();
 if(!user)return NextResponse.json({error:"Sign in with Discord before submitting a profile."},{status:401});
 const cfg=config();if(!cfg)return NextResponse.json({error:"Profile service is not configured."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(typeof body.username!=="string"||typeof body.avatarUrl!=="string"||typeof body.headline!=="string"||typeof body.bio!=="string"
  ||!Array.isArray(body.crafts)||!body.crafts.every(x=>typeof x==="string")||!Array.isArray(body.skills)||!body.skills.every(x=>typeof x==="string")
  ||!Array.isArray(body.services)||!body.services.every(x=>x&&typeof x==="object"&&typeof x.title==="string"&&typeof x.description==="string"&&typeof x.price==="number")
  ||!Array.isArray(body.portfolio)||!body.portfolio.every(x=>x&&typeof x==="object"&&typeof x.url==="string"&&typeof x.caption==="string")
  ||typeof body.rateType!=="string"||!["hourly","project","negotiable"].includes(body.rateType)
  ||typeof body.availability!=="string"||!["Available","Busy","Not taking commissions"].includes(body.availability)
  ||typeof body.discordUsername!=="string"||typeof body.robloxUrl!=="string"
  ||(body.videoUrl!==undefined&&typeof body.videoUrl!=="string")
  ||(body.rateAmount!==undefined&&typeof body.rateAmount!=="number"))return NextResponse.json({error:"Some profile fields are invalid."},{status:400});
 try{
  const result=await new ConvexHttpClient(cfg.url).mutation(api.developers.submit,{
   adminSecret:cfg.secret,username:body.username,displayName:user.displayName||user.username,
   discordId:user.id,avatarUrl:body.avatarUrl,headline:body.headline,bio:body.bio,
   crafts:body.crafts as string[],skills:body.skills as string[],services:body.services as {title:string;description:string;price:number}[],
   rateType:body.rateType as "hourly"|"project"|"negotiable",rateAmount:body.rateAmount as number|undefined,
   availability:body.availability as "Available"|"Busy"|"Not taking commissions",
   portfolio:body.portfolio as {url:string;caption:string}[],videoUrl:body.videoUrl as string|undefined,
   discordUsername: user.username, robloxUrl:body.robloxUrl,
  });
  return NextResponse.json({success:true,profileId:result,status:"pending"},{status:201,headers:{"Cache-Control":"no-store, max-age=0"}});
 }catch(error){const message=error instanceof Error?error.message:"Could not submit profile.";return NextResponse.json({error:message},{status:400})}
}
