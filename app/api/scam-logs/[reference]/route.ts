import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{reference:string}>}){const {reference}=await params;const url=process.env.NEXT_PUBLIC_CONVEX_URL||process.env.CONVEX_URL;const secret=process.env.CONVEX_ADMIN_API_SECRET||process.env.ADMIN_API_SECRET||process.env.REPORT_WRITE_SECRET;if(!url||!secret)return NextResponse.json({error:"Scam Logs are not configured."},{status:503});try{const report=await new ConvexHttpClient(url).query(api.scamLogs.publicGet,{reference});return report?NextResponse.json({report},{headers:{"Cache-Control":"no-store"}}):NextResponse.json({error:"Report not found."},{status:404})}catch{return NextResponse.json({error:"Could not load report."},{status:502})}}
