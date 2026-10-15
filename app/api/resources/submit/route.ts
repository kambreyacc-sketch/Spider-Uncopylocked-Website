import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before submitting a resource." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Resource submission is not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const categories = ["Packs", "Maps", "Audio", "Scripts", "UI", "VFX"];
  const platforms = ["Roblox", "Discord", "Other"];
  const licenses = ["Personal use", "Commercial use", "Credit required"];
  if (typeof body.title !== "string" || typeof body.category !== "string" || !categories.includes(body.category)
    || typeof body.description !== "string" || typeof body.thumbnailStorageId !== "string"
    || typeof body.fileStorageId !== "string" || typeof body.fileName !== "string"
    || typeof body.fileSize !== "number" || !Array.isArray(body.previewStorageIds)
    || !body.previewStorageIds.every(x => typeof x === "string")
    || !Array.isArray(body.tags) || !body.tags.every(x => typeof x === "string")
    || typeof body.platform !== "string" || !platforms.includes(body.platform)
    || typeof body.license !== "string" || !licenses.includes(body.license)) {
    return NextResponse.json({ error: "Some resource fields are missing or invalid." }, { status: 400 });
  }
  try {
    const client = new ConvexHttpClient(url);
    const active = await client.query(api.admin.getActiveRestrictionsForUser, { adminSecret: secret, targetDiscordId: user.id });
    if (active.some((r: { restrictionType: string }) => ["restricted", "temporary_ban", "permanent_ban", "upload_ban"].includes(r.restrictionType))) {
      return NextResponse.json({ error: "Your account is not allowed to submit resources while an active restriction applies." }, { status: 403 });
    }
    const resourceId = await client.mutation(api.resources.submit, {
      adminSecret: secret,
      title: body.title, category: body.category as any, description: body.description,
      tags: body.tags as string[], platform: body.platform as any, license: body.license as any,
      version: typeof body.version === "string" ? body.version : undefined,
      thumbnailStorageId: body.thumbnailStorageId as any,
      previewStorageIds: body.previewStorageIds as any[],
      fileStorageId: body.fileStorageId as any, fileName: body.fileName,
      fileSize: body.fileSize, fileLink: undefined,
      creatorName: user.displayName || user.username, creatorDiscordId: user.id, price: 0,
    });
    return NextResponse.json({ success: true, resourceId, status: "pending" }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    console.error("Secure resource submission failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
