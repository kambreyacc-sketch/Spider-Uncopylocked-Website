import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile, isSpiderAdmin } from "../../../../lib/session";
export const dynamic = "force-dynamic";
function config(){const url=process.env.NEXT_PUBLIC_CONVEX_URL||process.env.CONVEX_URL;const secret=(process.env.CONVEX_ADMIN_API_SECRET || process.env.ADMIN_API_SECRET);return url&&secret?{url,secret}:null;}
export async function GET(request:Request){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 const cfg=config();if(!cfg)return NextResponse.json({error:"Application service is not configured."},{status:503});
 const url=new URL(request.url),status=url.searchParams.get("status"),type=url.searchParams.get("type");
 const statuses=["pending","in_review","approved","rejected"],types=["Studio Registration","Posting Access","Content Creator","Staff Application","Hiring Access"];
 if(status&&!statuses.includes(status))return NextResponse.json({error:"Invalid status filter."},{status:400});
 if(type&&!types.includes(type))return NextResponse.json({error:"Invalid application type."},{status:400});
 try{const data=await new ConvexHttpClient(cfg.url).query(api.admin.listPlatformApplications,{adminSecret:cfg.secret,statusFilter:status?status as any:undefined,typeFilter:type?type as any:undefined});return NextResponse.json(data,{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){console.error("Admin community applications failed:",error);return NextResponse.json({error:"Unable to load applications."},{status:502})}
}
export async function PATCH(request:Request){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getSpiderProfile(),cfg=config();if(!user||!cfg)return NextResponse.json({error:"Application service is not configured."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(typeof body.applicationId!=="string"||!["pending","in_review","approved","rejected"].includes(String(body.status))||(body.reason!==undefined&&(typeof body.reason!=="string"||body.reason.length>1000)))return NextResponse.json({error:"Invalid application decision."},{status:400});
 try{const result=await new ConvexHttpClient(cfg.url).mutation(api.admin.reviewPlatformApplication,{adminSecret:cfg.secret,applicationId:body.applicationId as any,status:body.status as any,reason:typeof body.reason==="string"?body.reason:undefined,actorDiscordId:user.id,actorName:user.displayName||user.username});return NextResponse.json(result,{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not save application decision."},{status:400})}
}
