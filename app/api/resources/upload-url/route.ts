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
    const uploadUrl = await client.mutation(api.resources.generateUploadUrl, { adminSecret: secret });
    return NextResponse.json({ url: uploadUrl }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Generate secure resource upload URL failed:", error);
    return NextResponse.json({ error: "Could not prepare a secure upload." }, { status: 502 });
  }
}
