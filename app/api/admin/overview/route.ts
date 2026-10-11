import { NextResponse } from "next/server";
import { isSpiderAdmin } from "../../../../lib/session";
export const dynamic="force-dynamic";
export async function GET(){
 if(!(await isSpiderAdmin()))return NextResponse.json({error:"Forbidden"},{status:403});
 // Deliberately return no fabricated statistics. Counts will appear when each feature's
 // production Convex query is wired to the authenticated server-side identity.
 return NextResponse.json({stats:{}},{headers:{"Cache-Control":"no-store, max-age=0"}});
}
