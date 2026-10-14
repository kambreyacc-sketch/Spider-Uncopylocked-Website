import { NextResponse } from "next/server";
import { getSpiderProfile } from "@/lib/session";
import { getVipMembership } from "@/lib/vip";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getSpiderProfile();
  const membership = await getVipMembership(profile);
  return NextResponse.json(
    {
      signedIn: !!profile,
      vipActive: !!membership,
      membership: membership
        ? {
            robloxUsername: membership.robloxUsername,
            robloxUserId: membership.robloxUserId,
            verifiedAt: membership.verifiedAt,
            expiresAt: membership.expiresAt,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
