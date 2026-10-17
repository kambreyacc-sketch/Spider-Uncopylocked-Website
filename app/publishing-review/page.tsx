import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LockKeyhole } from "lucide-react";
import { getSpiderProfile } from "../../lib/session";
import SpiderSidebar from "../components/SpiderSidebar";
import PublishingModerationPanel from "../admin/publishing-panel";

export const dynamic = "force-dynamic";
const PUBLISHING_REVIEW_DISCORD_ID = "1404024989208019086";

export default async function PublishingReviewPage() {
  const user = await getSpiderProfile();
  if (!user) redirect("/api/auth/discord/login");
  if (user.id !== PUBLISHING_REVIEW_DISCORD_ID) {
    return (
      <main className="admin-denied">
        <div>
          <LockKeyhole size={36} />
          <p className="admin-kicker">SPIDER UNCOPYLOCKED / PRIVATE REVIEW</p>
          <h1>Access denied</h1>
          <p>This publishing review page is reserved for its designated reviewer account.</p>
          <Link href="/">Return to Spider Uncopylocked</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-layout">
      <SpiderSidebar />
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span className="admin-kicker">SPIDER UNCOPYLOCKED / PRIVATE WORKSPACE</span>
            <h1><ClipboardList size={24} style={{ display: "inline", verticalAlign: "middle", marginRight: 10 }} />Publishing Review</h1>
            <p>Review game marketplace listings, job posts, and studio submissions before they become public.</p>
          </div>
          <div className="admin-identity">
            {user.avatar ? <img src={user.avatar} alt="" /> : <span />}
            <div><b>{user.displayName}</b><small>Authorized reviewer</small></div>
            <LockKeyhole size={18} />
          </div>
        </header>
        <PublishingModerationPanel />
      </main>
    </div>
  );
}
