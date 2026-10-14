"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

type Status = "pending" | "approved" | "rejected";
type Developer = {
  _id: string;
  _creationTime: number;
  username: string;
  displayName: string;
  discordUsername: string;
  discordId: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  crafts: string[];
  skills: string[];
  services: { title: string; description: string; price: number }[];
  portfolio: { url: string; caption: string }[];
  robloxUrl: string;
  videoUrl?: string;
  rateType: string;
  rateAmount?: number;
  availability: string;
  status: Status;
  reviewReason?: string;
  createdAt: number;
  updatedAt: number;
};
type Payload = {
  applications: Developer[];
  counts: { pending: number; approved: number; rejected: number };
  limitPerStatus: number;
};
const numberFormat = new Intl.NumberFormat("en-US");

export default function DeveloperApplicationsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Status>("pending");
  const [busyId, setBusyId] = useState("");
  const [rejectionId, setRejectionId] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/applications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load applications.");
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data?.applications || []).filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const haystack = [
        item.displayName, item.username, item.discordUsername, item.discordId,
        item.headline, ...item.crafts, ...item.skills,
      ].join(" ").toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [data, query, status]);

  async function review(item: Developer, nextStatus: Status, decisionReason?: string) {
    setBusyId(item._id);
    setError("");
    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: item._id,
          status: nextStatus,
          reason: decisionReason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the review.");
      setRejectionId("");
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the review.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="application-admin">
      <div className="application-admin-summary">
        <div>
          <span className="admin-kicker">REVIEW QUEUE</span>
          <h2>Developer profile applications</h2>
          <p>These are real submissions from Convex’s developers table. Approving a profile makes it eligible to appear in the public developer directory.</p>
        </div>
        <button className="application-refresh" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? <LoaderCircle size={15} className="application-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      <div className="application-counts">
        {(["pending", "approved", "rejected"] as const).map((key) => (
          <button key={key} type="button" className={status === key ? "application-count active" : "application-count"} onClick={() => setStatus(key)}>
            <span>{key === "pending" ? "Pending review" : key === "approved" ? "Approved" : "Rejected"}</span>
            <strong>{loading ? "—" : numberFormat.format(data?.counts[key] ?? 0)}{!loading && (data?.counts[key] ?? 0) >= (data?.limitPerStatus ?? 200) ? "+" : ""}</strong>
          </button>
        ))}
        <button type="button" className={status === "all" ? "application-count active" : "application-count"} onClick={() => setStatus("all")}>
          <span>All loaded</span><strong>{loading ? "—" : numberFormat.format(data?.applications.length ?? 0)}</strong>
        </button>
      </div>

      <div className="application-toolbar">
        <label className="application-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, Discord, skill…" />
        </label>
        <span className="application-result-count">{visible.length} shown</span>
      </div>

      {error && <div className="application-error"><ShieldAlert size={18} /><p>{error}</p></div>}

      {loading ? (
        <div className="application-empty"><LoaderCircle size={24} className="application-spin" /><h3>Loading applications</h3><p>Connecting to Convex…</p></div>
      ) : visible.length === 0 ? (
        <div className="application-empty"><Clock3 size={24} /><h3>{query ? "No matches found" : status === "pending" ? "No pending applications" : "No applications in this view"}</h3><p>{query ? "Try a different search term." : "New developer profiles submitted through the website will appear here."}</p></div>
      ) : (
        <div className="application-list">
          {visible.map((item) => (
            <article key={item._id} className="application-card">
              <header className="application-card-head">
                <div className="application-person">
                  <img src={item.avatarUrl || "/spider-uncopylocked-pfp.svg"} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/spider-uncopylocked-pfp.svg"; }} />
                  <div><h3>{item.displayName || item.username}</h3><p>@{item.username} · Discord: {item.discordUsername || item.discordId}</p><small>Submitted {new Date(item.createdAt || item._creationTime).toLocaleString()}</small></div>
                </div>
                <span className={"application-status " + item.status}>{item.status}</span>
              </header>

              <div className="application-card-body">
                <h4>{item.headline}</h4>
                <p className="application-bio">{item.bio}</p>
                <div className="application-chip-list">{item.crafts.map((craft) => <span key={craft}>{craft}</span>)}{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>

                {item.services.length > 0 && <div className="application-subsection"><h5>Services</h5><div className="application-services">{item.services.map((service, index) => <div key={service.title + index}><b>{service.title}</b><span>{service.description}</span><small>${service.price.toLocaleString("en-US")} · USD</small></div>)}</div></div>}

                {item.portfolio.length > 0 && <div className="application-subsection"><h5>Portfolio</h5><div className="application-links">{item.portfolio.map((portfolio, index) => <a key={portfolio.url + index} href={portfolio.url} target="_blank" rel="noreferrer"><span>{portfolio.caption || "Portfolio item " + (index + 1)}</span><ExternalLink size={13} /></a>)}</div></div>}

                <div className="application-meta">
                  <span><b>Availability:</b> {item.availability}</span>
                  <span><b>Rate:</b> {item.rateType === "negotiable" ? "Negotiable" : item.rateAmount === undefined ? item.rateType : "$" + item.rateAmount.toLocaleString("en-US") + " / " + item.rateType}</span>
                  <a href={item.robloxUrl} target="_blank" rel="noreferrer">Roblox profile <ExternalLink size={13}/></a>
                  {item.videoUrl && <a href={item.videoUrl} target="_blank" rel="noreferrer">Video <ExternalLink size={13}/></a>}
                </div>

                {item.reviewReason && <div className="application-review-note"><b>Previous review note:</b> {item.reviewReason}</div>}
              </div>

              <footer className="application-card-actions">
                {rejectionId === item._id ? (
                  <div className="application-reject-form">
                    <label>Reason for rejection<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={1000} placeholder="Explain what the applicant needs to fix…" /></label>
                    <button type="button" className="application-button danger" disabled={busyId === item._id || reason.trim().length < 3} onClick={() => void review(item, "rejected", reason.trim())}>{busyId === item._id ? "Saving…" : "Confirm rejection"}</button>
                    <button type="button" className="application-button neutral" onClick={() => { setRejectionId(""); setReason(""); }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    {item.status !== "approved" && <button type="button" className="application-button primary" disabled={busyId === item._id} onClick={() => void review(item, "approved")}><Check size={15}/> Approve profile</button>}
                    {item.status !== "rejected" && <button type="button" className="application-button danger" disabled={busyId === item._id} onClick={() => { setRejectionId(item._id); setReason(""); }}><X size={15}/> Reject</button>}
                    {item.status !== "pending" && <button type="button" className="application-button neutral" disabled={busyId === item._id} onClick={() => void review(item, "pending")}><Clock3 size={15}/> Return to pending</button>}
                    {busyId === item._id && <span className="application-saving">Saving decision…</span>}
                  </>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
      <p className="application-footnote">For safety, review actions are checked by the server and the Convex function. Up to 200 records per status are loaded at a time.</p>
    </section>
  );
}
