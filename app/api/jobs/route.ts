import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before posting a job." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Job posting is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.title !== "string" || typeof body.description !== "string" || typeof body.craft !== "string"
    || typeof body.budgetMin !== "number" || typeof body.budgetMax !== "number"
    || typeof body.discordContact !== "string" || typeof body.posterName !== "string"
    || (body.deadline !== undefined && typeof body.deadline !== "string")) {
    return NextResponse.json({ error: "Complete all required job fields." }, { status: 400 });
  }
  try {
    const result = await new ConvexHttpClient(url).mutation(api.developers.postJob, {
      adminSecret: secret, title: body.title, description: body.description, craft: body.craft,
      budgetMin: body.budgetMin, budgetMax: body.budgetMax,
      deadline: typeof body.deadline === "string" && body.deadline ? body.deadline : undefined,
      discordContact: body.discordContact, posterDiscordId: user.id,
      posterName: typeof body.posterName === "string" ? body.posterName : user.displayName,
    });
    return NextResponse.json({ success: true, jobId: result, status: "pending" }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not post job.";
    return NextResponse.json({ error: message }, { status: message.includes("approved Posting Access") ? 403 : 400 });
  }
}
