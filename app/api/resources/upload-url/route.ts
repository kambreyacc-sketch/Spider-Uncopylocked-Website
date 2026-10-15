import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
export const dynamic = "force-dynamic";
export async function POST() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before uploading files." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Upload service is not configured." }, { status: 503 });
  try {
    const client = new ConvexHttpClient(url);
    const active = await client.query(api.admin.getActiveRestrictionsForUser, { adminSecret: secret, targetDiscordId: user.id });
    if (active.some((r: { restrictionType: string }) => ["restricted", "temporary_ban", "permanent_ban", "upload_ban"].includes(r.restrictionType))) {
      return NextResponse.json({ error: "Your account is not allowed to upload while an active restriction applies." }, { status: 403 });
    }
    const uploadUrl = await client.mutation(api.resources.generateUploadUrl, { adminSecret: secret });
    return NextResponse.json({ url: uploadUrl }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Generate secure resource upload URL failed:", error);
    return NextResponse.json({ error: "Could not prepare a secure upload." }, { status: 502 });
  }
}
