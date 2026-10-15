"use client";

import SpiderSidebar from "../../components/SpiderSidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, UploadCloud } from "lucide-react";

type ResourceSubmission = {
  _id: string;
  title: string;
  category: string;
  createdAt: number;
  status: "pending" | "active" | "rejected";
  reviewReason?: string;
  thumbnailUrl?: string | null;
};

export default function CreatorDashboard() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<ResourceSubmission[] | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/auth/discord/me", { cache: "no-store" });
        const data = await response.json();
        if (!data.user) {
          if (!cancelled) {
            setId("");
            setRows([]);
          }
          return;
        }
        if (cancelled) return;
        setId(data.user.id);
        setName(data.user.displayName || data.user.username || "Discord member");
        const submissionsResponse = await fetch("/api/resources/mine", { cache: "no-store" });
        const submissionsData = await submissionsResponse.json();
        if (!submissionsResponse.ok) throw new Error(submissionsData.error || "Could not load submissions.");
        if (!cancelled) setRows(submissionsData.resources || []);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load submissions.");
          setRows([]);
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

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
        <span className="spider-eyebrow">CREATOR DASHBOARD</span>
        <h1>My submissions</h1>
        <p className="resource-intro">{name ? "Submissions for " + name : "Sign in with Discord to view your submissions."}</p>
        {error && <p role="alert" className="resource-error">{error}</p>}
        {!id ? (
          <div className="resource-empty"><Link href="/api/auth/discord/login" className="spider-button-primary">Sign in with Discord</Link></div>
        ) : rows === undefined ? (
          <div className="resource-empty">Loading your submissions…</div>
        ) : rows.length === 0 ? (
          <div className="resource-empty"><h2>No submissions yet</h2><p>Your submissions and review status appear here.</p><Link href="/resources/upload" className="spider-button-primary">Upload free asset</Link></div>
        ) : (
          <div className="resource-submissions">
            {rows.map((resource) => (
              <article key={resource._id} className="resource-submission">
                {resource.thumbnailUrl && <img src={resource.thumbnailUrl} alt="" />}
                <div>
                  <h2>{resource.title}</h2>
                  <p>{resource.category} · Submitted {new Date(resource.createdAt).toLocaleDateString()}</p>
                  {resource.status === "pending" && <p>Awaiting staff review.</p>}
                  {resource.status === "rejected" && <p className="resource-rejection">Reason: {resource.reviewReason || "No reason supplied."}</p>}
                </div>
                <span className={"resource-status " + resource.status}>{resource.status === "active" ? "Published" : resource.status === "pending" ? "Pending review" : "Rejected"}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
