import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
export const dynamic="force-dynamic";
export async function GET(){
 const user=await getSpiderProfile();
 if(!user)return NextResponse.json({error:"Sign in with Discord to view submissions."},{status:401});
 const url=process.env.NEXT_PUBLIC_CONVEX_URL||process.env.CONVEX_URL,secret=process.env.CONVEX_ADMIN_API_SECRET;
 if(!url||!secret)return NextResponse.json({error:"Creator dashboard is not configured."},{status:503});
 try{const rows=await new ConvexHttpClient(url).query(api.resources.mine,{adminSecret:secret,creatorDiscordId:user.id});return NextResponse.json({resources:rows},{headers:{"Cache-Control":"no-store, max-age=0"}})}
 catch(error){console.error("Own resource submissions failed:",error);return NextResponse.json({error:"Could not load submissions."},{status:502})}
}
