import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ number: string }> };
async function numberParam(context: Context) { const params = await context.params; const n = Number(params.number); return Number.isSafeInteger(n) && n > 0 ? n : null; }

export async function GET(_request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in to view your application." }, { status: 401 });
  const applicationNumber = await numberParam(context);
  if (!applicationNumber) return NextResponse.json({ error: "Invalid application number." }, { status: 400 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application storage is not configured." }, { status: 503 });
  try {
    const result = await db.client.query(api.applications.getMine, { adminSecret: db.secret, applicantDiscordId: user.id, applicationNumber });
    if (!result) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("Application detail failed:", error); return NextResponse.json({ error: "Could not load the application." }, { status: 503 }); }
}

export async function PATCH(_request: Request, context: Context) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const applicationNumber = await numberParam(context);
  if (!applicationNumber) return NextResponse.json({ error: "Invalid application number." }, { status: 400 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Application storage is not configured." }, { status: 503 });
  try {
    const result = await db.client.mutation(api.applications.withdraw, { adminSecret: db.secret, applicantDiscordId: user.id, applicationNumber });
    return NextResponse.json(result);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not withdraw application." }, { status: 400 }); }
}
