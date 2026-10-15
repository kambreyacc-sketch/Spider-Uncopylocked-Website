import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { getSpiderProfile } from "../../../lib/session";
import { getServiceConvex } from "../../../lib/service-convex";
import { checkAccountRestriction } from "../../../lib/account-restrictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before creating a listing." }, { status: 401 });
  const restriction = await checkAccountRestriction(user.id, "publish");
  if (restriction.status === "unavailable") return NextResponse.json({ error: "Could not verify your account standing. Nothing was submitted." }, { status: 503 });
  if (restriction.status === "blocked") return NextResponse.json({ error: "Marketplace posting is blocked by an active " + restriction.kind.toLowerCase() + " action: " + restriction.reason }, { status: 403 });
  const db = getServiceConvex();
  if (!db) return NextResponse.json({ error: "Marketplace service is not configured. Nothing was submitted." }, { status: 503 });
  try {
    const approved = await db.client.query(api.applications.hasApprovedAccess, { adminSecret: db.secret, applicantDiscordId: user.id, type: "Marketplace posting access" });
    if (!approved) return NextResponse.json({ error: "Marketplace posting access has not been approved for your account. Submit an application first.", applyUrl: "/apply" }, { status: 403 });
  } catch (error) {
    console.error("Marketplace posting permission check failed:", error);
    return NextResponse.json({ error: "Could not verify marketplace posting access. No listing was submitted." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid listing form." }, { status: 400 }); }
  const text = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0,max) : "";
  const title = text("title",81), robloxUrl = text("robloxUrl",500), description = text("description",2000);
  const type = body.type;
  if (title.length < 1 || title.length > 80) return NextResponse.json({ error: "Listing title must be 1–80 characters." }, { status: 400 });
  if (type !== "Game" && type !== "UGC Group") return NextResponse.json({ error: "Choose a valid listing type." }, { status: 400 });
  if (!/^https:\/\/(www\.)?roblox\.com\//i.test(robloxUrl)) return NextResponse.json({ error: "Use a valid HTTPS Roblox game/group URL." }, { status: 400 });
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000_000) return NextResponse.json({ error: "Enter a valid asking price greater than zero." }, { status: 400 });
  if (description.length > 2000) return NextResponse.json({ error: "Description must be 2,000 characters or fewer." }, { status: 400 });
  const contactDiscord = text("contactDiscord",100), contactEmail = text("contactEmail",254), contactPhone = text("contactPhone",40);
  if (!contactDiscord && !contactEmail && !contactPhone) return NextResponse.json({ error: "Add at least one contact method." }, { status: 400 });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return NextResponse.json({ error: "Enter a valid contact email." }, { status: 400 });
  const imageStorageId = typeof body.imageStorageId === "string" && body.imageStorageId.length < 100 ? body.imageStorageId : undefined;
  const imageUrl = text("imageUrl",1000) || undefined;
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:" || !(url.hostname === "rbxcdn.com" || url.hostname.endsWith(".rbxcdn.com"))) return NextResponse.json({ error: "Only HTTPS Roblox CDN preview images are accepted." }, { status: 400 });
    } catch { return NextResponse.json({ error: "Preview image URL is invalid." }, { status: 400 }); }
  }
  if (!imageStorageId && !imageUrl) return NextResponse.json({ error: "Upload a thumbnail or load a public Roblox CDN thumbnail." }, { status: 400 });
  const sellerRobloxId = text("sellerRobloxId",32), sellerName = text("sellerName",60);
  if (!sellerName || !/^\d{1,32}$/.test(sellerRobloxId)) return NextResponse.json({ error: "Enter your Roblox username and numeric user ID. Spider has not independently verified them." }, { status: 400 });
  try {
    const id = await db.client.mutation(api.listings.submitListing, {
      adminSecret: db.secret, title, type, robloxUrl, price, description,
      ...(imageStorageId ? { imageStorageId: imageStorageId as any } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      sellerRobloxId, sellerName,
      ...(contactDiscord ? { contactDiscord } : {}),
      ...(contactEmail ? { contactEmail } : {}),
      ...(contactPhone ? { contactPhone } : {}),
    });
    return NextResponse.json({ success: true, listingId: id, status: "pending", message: "Your listing was submitted for moderator review and is not publicly visible yet." }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing submission failed.";
    console.error("Listing submission failed:", error);
    return NextResponse.json({ error: message.includes("Enter a listing title") || message.includes("valid Roblox URL") || message.includes("Price must") || message.includes("Description is too long") || message.includes("contact method") ? message : "Listing could not be saved. Confirm marketplace and Convex services are deployed." }, { status: 503 });
  }
}
