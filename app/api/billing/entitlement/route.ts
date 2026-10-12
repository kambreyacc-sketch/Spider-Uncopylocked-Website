import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { getBillingDb } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ premium: false, planKey: "free", status: "unauthenticated" }, { status: 401 });

  const db = getBillingDb();
  if (!db) return NextResponse.json({ error: "Billing entitlement service is not configured." }, { status: 503 });

  try {
    const entitlement = await db.client.query(api.billing.getEntitlement, {
      adminSecret: db.secret,
      discordId: user.id,
    });
    return NextResponse.json(entitlement, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Billing entitlement lookup failed:", error);
    return NextResponse.json({ error: "Premium status is temporarily unavailable." }, { status: 502 });
  }
}
