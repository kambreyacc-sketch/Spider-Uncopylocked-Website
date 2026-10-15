"use client";

import SpiderSidebar from "../../components/SpiderSidebar";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, UploadCloud, ShieldAlert, FileBox } from "lucide-react";

type Resource = {
  _id: string;
  title: string;
  category: string;
  createdAt: number;
  status: "pending" | "active" | "rejected";
  reviewReason?: string;
  thumbnailUrl?: string | null;
};

export default function CreatorDashboard() {
  const [user, setUser] = useState<{ id: string; displayName?: string; username?: string } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/resources/mine", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your submissions.");
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your submissions are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then(response => response.json())
      .then(data => { if (active) setUser(data.user || null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);

  const displayName = user?.displayName || user?.username || "your account";

  return (
    <main className="resource-page">
      <SpiderSidebar />
      <header className="resource-nav">
        <Link href="/" className="resource-brand"><img className="resource-brand-image" src="/spider-uncopylocked-pfp.webp" alt="" /> SPIDER UNCOPYLOCKED</Link>
        <nav><Link href="/resources">Asset library</Link></nav>
        <Link href="/resources/upload" className="resource-upload"><UploadCloud size={15} /> Upload asset</Link>
      </header>
      <div className="resource-shell">
        <Link href="/" className="resource-back"><ArrowLeft size={14} /> Home</Link>
        <span className="spider-eyebrow">CREATOR DASHBOARD / PRIVATE SUBMISSIONS</span>
        <h1>My submissions</h1>
        <p className="resource-intro">{user ? "Submission history for " + displayName + ". Unapproved asset previews are not publicly exposed." : "Sign in with Discord to view your submission history."}</p>
        {authLoading ? <div className="resource-empty">Checking your account…</div> : !user ? (
          <div className="resource-empty"><Link href="/api/auth/discord/login" className="spider-button-primary">Sign in with Discord</Link></div>
        ) : (
          <>
            <div className="resource-dashboard-actions">
              <Link href="/resources/upload" className="spider-button-primary"><UploadCloud size={15} /> Upload a free asset</Link>
              <button className="hire-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> {loading ? "Refreshing…" : "Refresh"}</button>
            </div>
            {error && <div className="resource-notice" role="alert"><ShieldAlert size={17} /><span>{error}</span><button onClick={() => void load()} type="button">Try again</button></div>}
            {loading && resources.length === 0 ? <div className="resource-empty">Loading your submissions…</div> : resources.length === 0 ? (
              <div className="resource-empty"><FileBox size={26} /><h2>No submissions yet</h2><p>When you upload an asset, its review status will be shown here.</p><Link href="/resources/upload" className="spider-button-primary">Upload free asset</Link></div>
            ) : (
              <div className="resource-submissions">
                {resources.map(resource => (
                  <article key={resource._id} className="resource-submission">
                    {resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt="" loading="lazy" /> : <span className="resource-submission-placeholder"><FileBox size={23} /></span>}
                    <div>
                      <h2>{resource.title}</h2>
                      <p>{resource.category} · Submitted {new Date(resource.createdAt).toLocaleDateString()}</p>
                      {resource.status === "rejected" && <p className="resource-rejection">Reviewer feedback: {resource.reviewReason || "No reason was provided. Contact support if you need clarification."}</p>}
                      {resource.status === "pending" && <p className="resource-review-hint">Your asset remains unpublished while it awaits moderator review.</p>}
                    </div>
                    <span className={"resource-status " + resource.status}>{resource.status === "active" ? "Published" : resource.status === "pending" ? "Pending review" : "Rejected"}</span>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
