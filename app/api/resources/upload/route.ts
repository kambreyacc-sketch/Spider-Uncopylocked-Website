import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getServiceConvex } from "../../../../lib/service-convex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const categories = ["Packs", "Maps", "Audio", "Scripts", "UI", "VFX"] as const;
const licenses = ["Personal use", "Commercial use", "Credit required"] as const;
const platforms = ["Roblox", "Discord", "Other"] as const;

export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before submitting an asset." }, { status: 401 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Resource storage is not configured. Nothing was submitted." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, { adminSecret: db.secret, applicantDiscordId: user.id, type: "Resource / leaker upload" });
    if (!approved) return NextResponse.json({ error: "Resource upload access has not been approved for your account. Apply first.", applyUrl: "/apply" }, { status: 403 });
  } catch (error) { console.error("Resource permission check failed:", error); return NextResponse.json({ error: "Could not verify upload permission. Access remains locked." }, { status: 503 }); }
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload submission." }, { status: 400 }); }
  const string = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0,max) : "";
  if (typeof body.category !== "string" || !categories.includes(body.category as typeof categories[number])) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  if (typeof body.platform !== "string" || !platforms.includes(body.platform as typeof platforms[number])) return NextResponse.json({ error: "Choose a valid platform." }, { status: 400 });
  if (typeof body.license !== "string" || !licenses.includes(body.license as typeof licenses[number])) return NextResponse.json({ error: "Choose a valid license." }, { status: 400 });
  const storageId = (key: string) => typeof body[key] === "string" && (body[key] as string).length < 100 ? body[key] as string : "";
  const thumbnailStorageId = storageId("thumbnailStorageId"), fileStorageId = storageId("fileStorageId");
  const previewStorageIds = Array.isArray(body.previewStorageIds) ? body.previewStorageIds.filter((x): x is string => typeof x === "string").slice(0,5) : [];
  if (!thumbnailStorageId || !fileStorageId || previewStorageIds.length !== (Array.isArray(body.previewStorageIds) ? body.previewStorageIds.length : 0)) return NextResponse.json({ error: "Upload the required thumbnail and asset file first." }, { status: 400 });
  const tags = Array.isArray(body.tags) ? body.tags.filter((x): x is string => typeof x === "string").map(x=>x.trim()).filter(Boolean).slice(0,5) : [];
  try {
    const result = await db.client.mutation(api.resources.submit, {
      adminSecret: db.secret,
      title: string("title",60),
      category: body.category as typeof categories[number],
      description: string("description",3000),
      tags,
      platform: body.platform as typeof platforms[number],
      license: body.license as typeof licenses[number],
      ...(string("version",30) ? { version: string("version",30) } : {}),
      thumbnailStorageId: thumbnailStorageId as any,
      previewStorageIds: previewStorageIds as any,
      fileStorageId: fileStorageId as any,
      fileName: string("fileName",255),
      fileSize: Number(body.fileSize),
      creatorName: user.displayName || user.username,
      creatorDiscordId: user.id,
      price: 0,
    });
    return NextResponse.json({ success: true, resourceId: result, status: "pending", message: "Your upload was saved privately and is awaiting moderator review." }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload submission failed.";
    const expected = /Name is required|Description is required|Sign in with Discord|tags|previews|Files must|file type|already submitted|must be free|storage|thumbnail/i.test(message);
    if (!expected) console.error("Resource submission failed:", error);
    return NextResponse.json({ error: expected ? message : "Upload could not be saved. Please try again later." }, { status: expected ? 400 : 503 });
  }
}
