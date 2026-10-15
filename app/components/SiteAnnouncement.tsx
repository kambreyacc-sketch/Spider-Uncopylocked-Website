import { api } from "../../convex/_generated/api";
import { getServiceConvex } from "../../lib/service-convex";

export default async function SiteAnnouncement() {
  const db = getServiceConvex();
  if (!db) return null;
  try {
    const settings = await db.client.query(api.admin.getPublicSettings, {});
    const announcement = settings.announcementEnabled ? settings.announcement.trim() : "";
    const featuredText = settings.homepageFeaturedText.trim();
    if (!announcement && !featuredText) return null;
    return (
      <>
        {announcement && (
          <aside className="spider-site-announcement" aria-label="Website announcement">
            <span className="spider-site-announcement-mark" aria-hidden="true">i</span>
            <span>{announcement}</span>
          </aside>
        )}
        {featuredText && (
          <div className="spider-site-featured-text">
            <span className="spider-site-featured-dot" aria-hidden="true" />
            <span>{featuredText}</span>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Public homepage settings lookup failed:", error);
    return null;
  }
}
