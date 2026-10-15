import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSpiderProfile, isSpiderAdmin } from "../../../lib/session";
import { hasStaffCapability, type StaffCapability } from "../../../lib/staff-permissions";
import SpiderSidebar from "../../components/SpiderSidebar";
import DeveloperApplicationsPanel from "../applications-panel";
import BillingAdminPanel from "../billing-panel";
import SupportAdminPanel from "../support-panel";
import ApplicationRecordsPanel from "../application-records-panel";
import ModerationReviewPanel from "../moderation-panel";
import ReportReviewPanel from "../report-review-panel";
import AdminOperationsPanel from "../operations-panel";

const pages: Record<string, { title: string; description: string }> = {
  reports: { title: "Scam reports", description: "Review submitted reports, supporting evidence, and moderation decisions." },
  restrictions: { title: "User restrictions", description: "Review restrictions, suspensions, reasons, and expiry information." },
  "reported-content": { title: "Content moderation", description: "Review pending resource and marketplace submissions before publication." },
  users: { title: "Users", description: "Search accounts and review related studio, job, and moderation history." },
  roles: { title: "Staff roles & permissions", description: "Manage website staff grants, review effective permissions, and audit role changes." },
  applications: { title: "Applications & approvals", description: "Review studio, resource, marketplace, developer, creator, and staff applications." },
  billing: { title: "Billing & subscriptions", description: "Review subscription metadata, invoice references, and Stripe webhook health." },
  studios: { title: "Studios", description: "Review studio submissions, ownership, games, and approval status." },
  jobs: { title: "Job posts", description: "Review job terms, payment disclosures, reports, and listing status." },
  matches: { title: "Match requests", description: "Review real developer profiles, project requirements, and matching explanations." },
  invitations: { title: "Project invitations", description: "Track pending, accepted, declined, and withdrawn invitations." },
  support: { title: "Messages & support", description: "Manage support requests and explicitly reported content. Ordinary DMs remain private." },
  activity: { title: "Admin activity log", description: "Review recorded administrative actions and their reasons." },
  content: { title: "Website content", description: "Manage supported announcements, featured content, and policy pages." },
};

const sectionCapabilities: Record<string, StaffCapability> = {
  support: "support.view",
  applications: "applications.view",
  reports: "reports.view",
  "reported-content": "content.view",
  restrictions: "restrictions.view",
};

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();
  const profile = await getSpiderProfile();
  if (!profile) redirect("/admin");
  if (!(await isSpiderAdmin())) {
    const capability = sectionCapabilities[section];
    if (!capability || !(await hasStaffCapability(capability, profile))) redirect("/admin");
  }

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
        {section === "applications" ? (
          <><ApplicationRecordsPanel /><DeveloperApplicationsPanel /></>
        ) : section === "support" ? (
          <SupportAdminPanel />
        ) : section === "reports" ? (
          <ReportReviewPanel />
        ) : section === "reported-content" ? (
          <ModerationReviewPanel />
        ) : section === "billing" ? (
          <BillingAdminPanel />
        ) : section === "users" ? (
          <AdminOperationsPanel section="users" />
        ) : section === "roles" ? (
          <AdminOperationsPanel section="roles" />
        ) : section === "studios" ? (
          <AdminOperationsPanel section="studios" />
        ) : section === "jobs" ? (
          <AdminOperationsPanel section="jobs" />
        ) : section === "restrictions" ? (
          <AdminOperationsPanel section="restrictions" />
        ) : section === "activity" ? (
          <AdminOperationsPanel section="activity" />
        ) : section === "content" ? (
          <AdminOperationsPanel section="settings" />
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
