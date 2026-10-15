import { ConvexHttpClient } from "convex/browser";

/** Server-only Convex service connection used after Next.js session authorization. */
export function getServiceConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.ADMIN_API_SECRET || process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return null;
  return { client: new ConvexHttpClient(url), secret };
}
