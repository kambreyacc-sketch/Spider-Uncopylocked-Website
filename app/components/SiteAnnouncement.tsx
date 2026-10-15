import { api } from "../../convex/_generated/api";
import { getServiceConvex } from "../../lib/service-convex";

export default async function SiteAnnouncement() {
  const db = getServiceConvex();
  if (!db) return null;
  try {
    const settings = await db.client.query(api.admin.getPublicSettings, {});
    if (!settings.announcementEnabled || !settings.announcement.trim()) return null;
    return (
      <aside className="spider-site-announcement" aria-label="Website announcement">
        <span className="spider-site-announcement-mark" aria-hidden="true">i</span>
        <span>{settings.announcement}</span>
      </aside>
    );
  } catch (error) {
    console.error("Public homepage settings lookup failed:", error);
    return null;
  }
}
