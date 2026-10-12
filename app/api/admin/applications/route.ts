import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { isSpiderAdmin } from "../../../../lib/session";

export const dynamic = "force-dynamic";

function getServerConfig() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

export async function GET() {
  if (!(await isSpiderAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = getServerConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Admin database connection is not configured. Add the required server environment variables and retry." },
      { status: 503 }
    );
  }

  try {
    const client = new ConvexHttpClient(config.url);
    const data = await client.query(api.admin.listDeveloperApplications, {
      adminSecret: config.secret,
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Admin application list failed:", error);
    return NextResponse.json(
      { error: "Could not load developer applications. Check that the Convex admin secret matches the Vercel setting and that Convex functions have deployed." },
      { status: 502 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isSpiderAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = getServerConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Admin database connection is not configured. Add the required server environment variables and retry." },
      { status: 503 }
    );
  }

  let body: { developerId?: unknown; status?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.developerId !== "string" || !body.developerId) {
    return NextResponse.json({ error: "A developer ID is required." }, { status: 400 });
  }
  if (!["pending", "approved", "rejected"].includes(String(body.status))) {
    return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  }
  if (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000)) {
    return NextResponse.json({ error: "The review reason must be 1,000 characters or fewer." }, { status: 400 });
  }

  try {
    const client = new ConvexHttpClient(config.url);
    const result = await client.mutation(api.admin.reviewDeveloperApplication, {
      adminSecret: config.secret,
      developerId: body.developerId as any,
      status: body.status as "pending" | "approved" | "rejected",
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update application.";
    if (message.includes("rejection reason")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Admin application review failed:", error);
    return NextResponse.json(
      { error: "Could not save the decision. Check the Convex deployment and server secret settings." },
      { status: 502 }
    );
  }
}
