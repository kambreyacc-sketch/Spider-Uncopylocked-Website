import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSpiderAdmin } from "../../../lib/session";
import SpiderSidebar from "../../components/SpiderSidebar";
import DeveloperApplicationsPanel from "../applications-panel";
import BillingAdminPanel from "../billing-panel";
import SupportAdminPanel from "../support-panel";
import ResourceModerationPanel from "../resource-moderation-panel";
import PlatformApplicationsPanel from "../platform-applications-panel";
import UserRestrictionsPanel from "../user-restrictions-panel";
import PublishingModerationPanel from "../publishing-panel";

const pages: Record<string, { title: string; description: string }> = {
  reports: { title: "Scam reports", description: "Review submitted reports, supporting evidence, and moderation decisions." },
  restrictions: { title: "User restrictions", description: "Review restrictions, suspensions, reasons, and expiry information." },
  "reported-content": { title: "Reported content", description: "Review user-submitted reports about profiles, studios, and listings." },
  users: { title: "Users", description: "Search accounts and review related studio, job, and moderation history." },
  applications: { title: "Developer applications", description: "Review developer profiles submitted through Spider Uncopylocked." },
  "community-applications": { title: "Community applications", description: "Review studio, posting access, creator, staff, and hiring applications." },
  uploads: { title: "Resource moderation", description: "Review unpublished asset submissions before anything is made available to members." },
  publishing: { title: "Publishing review", description: "Approve game listings, job posts, and studio registrations before publication." },
  billing: { title: "Billing & subscriptions", description: "Review subscription metadata, invoice references, and Stripe webhook health." },
  studios: { title: "Studios", description: "Review studio submissions, ownership, games, and approval status." },
  jobs: { title: "Job posts", description: "Review job terms, payment disclosures, reports, and listing status." },
  matches: { title: "Match requests", description: "Review real developer profiles, project requirements, and matching explanations." },
  invitations: { title: "Project invitations", description: "Track pending, accepted, declined, and withdrawn invitations." },
  support: { title: "Messages & support", description: "Manage support requests and explicitly reported content. Ordinary DMs remain private." },
  activity: { title: "Admin activity log", description: "Review recorded administrative actions and their reasons." },
  content: { title: "Website content", description: "Manage supported announcements, featured content, and policy pages." },
};

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  if (!(await isSpiderAdmin())) redirect("/admin");
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();

  return (
    <div className="admin-layout">
      <SpiderSidebar />
      <main className="admin-main">
        <Link className="admin-back" href="/admin">← Back to dashboard</Link>
        <header className="admin-top">
          <div>
            <span className="admin-kicker">SPIDER UNCOPYLOCKED / ADMINISTRATION</span>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>
        </header>
        {section === "publishing" || section === "jobs" || section === "studios" ? (
          <PublishingModerationPanel initialTab={section === "jobs" ? "job" : section === "studios" ? "studio" : "listing"} />
        ) : section === "restrictions" ? (
          <UserRestrictionsPanel />
        ) : section === "community-applications" ? (
          <PlatformApplicationsPanel />
        ) : section === "support" ? (
          <SupportAdminPanel />
        ) : section === "uploads" ? (
          <ResourceModerationPanel />
        ) : section === "applications" ? (
          <DeveloperApplicationsPanel />
        ) : section === "billing" ? (
          <BillingAdminPanel />
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-mark">SU</div>
            <h2>Secure module foundation</h2>
            <p>This section is routed and protected, but its records and actions are not enabled until the corresponding database queries and audit-safe mutations are connected. No demo records are displayed.</p>
            <Link href="/admin">Return to overview</Link>
          </div>
        )}
      </main>
    </div>
  );
}
