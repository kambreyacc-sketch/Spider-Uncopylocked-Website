import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config(){const url=process.env.NEXT_PUBLIC_CONVEX_URL||process.env.CONVEX_URL;const secret=process.env.CONVEX_ADMIN_API_SECRET;return url&&secret?{url,secret}:null;}
export async function GET(){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 const cfg=config();if(!cfg)return NextResponse.json({error:"Restriction service is not configured."},{status:503});
 try{const restrictions=await new ConvexHttpClient(cfg.url).query(api.admin.listUserRestrictions,{adminSecret:cfg.secret});return NextResponse.json({restrictions},{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){console.error("Restriction list failed:",error);return NextResponse.json({error:"Could not load active restrictions."},{status:502})}
}
export async function POST(request:Request){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getSpiderProfile(),cfg=config();if(!user||!cfg)return NextResponse.json({error:"Restriction service is not configured."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 const types=["warning","restricted","temporary_ban","permanent_ban","upload_ban","posting_ban"];
 if(typeof body.targetDiscordId!=="string"||typeof body.targetDisplayName!=="string"||typeof body.reason!=="string"||typeof body.restrictionType!=="string"||!types.includes(body.restrictionType)||(body.expiresAt!==undefined&&typeof body.expiresAt!=="number"))return NextResponse.json({error:"Complete all required restriction fields."},{status:400});
 try{const result=await new ConvexHttpClient(cfg.url).mutation(api.admin.createUserRestriction,{adminSecret:cfg.secret,targetDiscordId:body.targetDiscordId,targetDisplayName:body.targetDisplayName,restrictionType:body.restrictionType as any,reason:body.reason,expiresAt:body.expiresAt as number|undefined,actorDiscordId:user.id,actorName:user.displayName||user.username});return NextResponse.json(result,{status:201,headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not create restriction."},{status:400})}
}
export async function PATCH(request:Request){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getSpiderProfile(),cfg=config();if(!user||!cfg)return NextResponse.json({error:"Restriction service is not configured."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(typeof body.restrictionId!=="string")return NextResponse.json({error:"Restriction ID is required."},{status:400});
 try{const result=await new ConvexHttpClient(cfg.url).mutation(api.admin.revokeUserRestriction,{adminSecret:cfg.secret,restrictionId:body.restrictionId as any,actorDiscordId:user.id,actorName:user.displayName||user.username,reason:typeof body.reason==="string"?body.reason:undefined});return NextResponse.json(result,{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not revoke restriction."},{status:400})}
}
