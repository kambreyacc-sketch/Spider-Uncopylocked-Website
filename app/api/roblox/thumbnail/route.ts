import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("placeId") || "";
  if (!/^\d{1,20}$/.test(raw)) return NextResponse.json({ error: "Enter a valid Roblox place ID." }, { status: 400 });
  try {
    const detailsResponse = await fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${raw}`, { next: { revalidate: 3600 } });
    if (!detailsResponse.ok) return NextResponse.json({ error: "Could not look up this Roblox experience." }, { status: 502 });
    const details = await detailsResponse.json();
    const universeId = details?.[0]?.universeId;
    if (!universeId) return NextResponse.json({ error: "No public experience details were found for this place." }, { status: 404 });
    const imageResponse = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`, { next: { revalidate: 3600 } });
    if (!imageResponse.ok) return NextResponse.json({ error: "Could not load the Roblox thumbnail." }, { status: 502 });
    const imageData = await imageResponse.json();
    const imageUrl = imageData?.data?.[0]?.imageUrl;
    if (!imageUrl) return NextResponse.json({ error: "No public thumbnail is available for this experience." }, { status: 404 });
    return NextResponse.json({ imageUrl, universeId }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Roblox thumbnail lookup is temporarily unavailable." }, { status: 502 });
  }
}
