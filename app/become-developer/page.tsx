"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowLeft, Plus, Send, Trash2, Save, ShieldCheck } from "lucide-react";

const crafts = ["Scripting", "Building", "UI/UX", "3D Modeling", "Animation", "VFX", "GFX", "Audio"];
type Service = { title: string; description: string; price: number };
type Portfolio = { url: string; caption: string };
type Application = { applicationNumber: number; type: string; subject: string; status: string; decisionReason?: string; updatedAt: number; answers?: Record<string, unknown> };

export default function BecomeDeveloperPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationNumber, setApplicationNumber] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    username: "", displayName: "", avatarUrl: "", headline: "", bio: "", crafts: ["Scripting"] as string[],
    skills: "", services: [{ title: "", description: "", price: 0 }] as Service[], rateType: "project",
    rateAmount: "25", availability: "Available", portfolio: [{ url: "", caption: "" }, { url: "", caption: "" }, { url: "", caption: "" }] as Portfolio[],
    videoUrl: "", discordUsername: "", robloxUrl: "", ownWork: false,
  });

  function restoreDraft(answers: Record<string, unknown>) {
    const text = (key: string) => typeof answers[key] === "string" ? String(answers[key]) : "";
    const rawPortfolio = Array.isArray(answers.portfolio) ? answers.portfolio : [];
    const portfolio = rawPortfolio.map((item: any) => ({
      url: typeof item?.url === "string" ? item.url : "",
      caption: typeof item?.caption === "string" ? item.caption : "",
    })).slice(0, 9);
    while (portfolio.length < 3) portfolio.push({ url: "", caption: "" });
    const rawServices = Array.isArray(answers.services) ? answers.services : [];
    const services = rawServices.map((item: any) => ({
      title: typeof item?.title === "string" ? item.title : "",
      description: typeof item?.description === "string" ? item.description : "",
      price: Number.isFinite(Number(item?.price)) ? Number(item.price) : 0,
    })).slice(0, 12);
    if (!services.length) services.push({ title: "", description: "", price: 0 });
    const roles = text("roles").split(",").map(item => item.trim()).filter(item => crafts.includes(item));
    const rateType = ["hourly", "project", "negotiable"].includes(text("rateType")) ? text("rateType") : "project";
    const availability = ["Available", "Busy", "Not taking commissions"].includes(text("availability")) ? text("availability") : "Available";
    setF(current => ({
      ...current,
      username: text("username"),
      displayName: text("displayName") || current.displayName,
      avatarUrl: text("avatarUrl") || current.avatarUrl,
      headline: text("headline"),
      bio: text("experience"),
      crafts: roles.length ? roles : ["Scripting"],
      skills: text("skills"),
      services,
      rateType,
      rateAmount: text("rateAmount") || "25",
      availability,
      portfolio,
      videoUrl: text("videoUrl"),
      discordUsername: text("discordUsername") || current.discordUsername,
      robloxUrl: text("robloxUrl"),
      ownWork: false,
    }));
  }

  const loadApplications = useCallback(async () => {
    try {
      const response = await fetch("/api/applications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Application history is unavailable.");
      const mine = (data.applications || []).filter((item: Application) => item.type === "Developer profile");
      setApplications(mine);
      const latestDraft = mine.find((item: Application) => item.status === "Draft");
      setApplicationNumber(latestDraft?.applicationNumber);
      if (latestDraft?.answers) restoreDraft(latestDraft.answers);
    } catch (caught) {
      if (caught instanceof Error) setError(caught.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (!active) return;
        setUser(data.user || null);
        if (data.user) setF(current => ({
          ...current,
          displayName: data.user.displayName || data.user.username || "",
          discordUsername: data.user.username || "",
          avatarUrl: data.user.avatar || "",
        }));
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (user) void loadApplications(); }, [user, loadApplications]);

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF(current => ({ ...current, [key]: value }));
  }
  function toggleCraft(craft: string) {
    setF(current => ({ ...current, crafts: current.crafts.includes(craft) ? current.crafts.filter(item => item !== craft) : [...current.crafts, craft] }));
  }

  function makeAnswers() {
    return {
      username: f.username.trim(), displayName: f.displayName.trim(), avatarUrl: f.avatarUrl.trim(),
      headline: f.headline.trim(), experience: f.bio.trim(), roles: f.crafts.join(", "),
      skills: f.skills.split(",").map(item => item.trim()).filter(Boolean).join(", "),
      services: f.services.filter(service => service.title.trim()).slice(0, 12),
      rateType: f.rateType, rateAmount: f.rateType === "negotiable" ? "" : f.rateAmount,
      availability: f.availability, portfolio: f.portfolio.filter(item => item.url.trim()).slice(0, 9),
      portfolioUrl: f.portfolio.find(item => item.url.trim())?.url.trim() || "",
      videoUrl: f.videoUrl.trim(), discordUsername: f.discordUsername.trim(), robloxUrl: f.robloxUrl.trim(),
    };
  }

  async function save(intent: "draft" | "submit", event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setError(""); setFeedback("");
    if (!user) { window.location.href = "/api/auth/discord/login"; return; }
    if (intent === "submit" && !f.ownWork) { setError("Confirm that this is your own work before submitting."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Developer profile",
          subject: "Developer profile: " + (f.displayName.trim() || f.username.trim() || user.username || "new applicant"),
          answers: makeAnswers(),
          ...(applicationNumber ? { applicationNumber } : {}),
          intent,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your application could not be saved.");
      setApplicationNumber(result.applicationNumber);
      setFeedback(intent === "draft"
        ? "Draft #" + result.applicationNumber + " saved privately. You can return to finish it."
        : "Application #" + result.applicationNumber + " submitted for staff review. Your profile will not be published unless approved.");
      await loadApplications();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your application could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content form-page">
        <Link href="/developers" className="hire-back"><ArrowLeft size={15} /> Back to developers</Link>
        <header className="hire-page-head">
          <div><span className="spider-eyebrow">CREATOR APPLICATION</span><h1>Become a developer</h1><p>Submit your portfolio for review. Profiles are published only after an authorized reviewer approves the application.</p></div>
        </header>
        {authLoading ? <div className="hire-empty">Checking your account…</div> : !user ? (
          <div className="hire-empty"><h2>Sign in to continue</h2><p>Your application is linked to your signed-in Discord account.</p><Link className="hire-primary" href="/api/auth/discord/login">Sign in with Discord</Link></div>
        ) : (
          <>
            <section className="hire-panel dashboard-panel">
              <div className="developer-application-heading"><div><h2>Your developer applications</h2><p>Track review decisions and resume drafts.</p></div><ShieldCheck size={20}/></div>
              {applications.length === 0 ? <p className="muted-copy">No developer application has been submitted yet.</p> : applications.map(item => (
                <div className="dashboard-profile" key={item.applicationNumber}>
                  <span><b>Application #{item.applicationNumber}</b><small>{item.subject} · Updated {new Date(item.updatedAt).toLocaleString()}</small>{item.decisionReason && <small>Reviewer feedback: {item.decisionReason}</small>}</span>
                  <span className={"support-status-chip status-" + item.status.toLowerCase().replaceAll(" ", "-")}>{item.status}</span>
                  {item.status === "Draft" && <button type="button" className="hire-secondary" onClick={() => { setApplicationNumber(item.applicationNumber); if (item.answers) restoreDraft(item.answers); setFeedback("Draft #" + item.applicationNumber + " loaded. Review your fields and save or submit when ready."); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Resume draft</button>}
                </div>
              ))}
            </section>
            <form className="hire-form" onSubmit={event => void save("submit", event)}>
              <h2>Profile details</h2>
              <div className="form-two">
                <label>Display name<input required maxLength={40} value={f.displayName} onChange={e => set("displayName", e.target.value)} /></label>
                <label>Username<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_-]+" value={f.username} onChange={e => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="yourname" /></label>
              </div>
              <label>Avatar image URL (HTTPS)<input required type="url" value={f.avatarUrl} onChange={e => set("avatarUrl", e.target.value)} placeholder="https://…" /></label>
              <label>Headline<input required minLength={5} maxLength={100} value={f.headline} onChange={e => set("headline", e.target.value)} placeholder="Roblox scripter specializing in gameplay systems" /></label>
              <label>Experience and bio<textarea required minLength={20} maxLength={2000} rows={5} value={f.bio} onChange={e => set("bio", e.target.value)} placeholder="Relevant experience, approach, and what you enjoy building…" /></label>
              <span className="form-label">Development roles</span>
              <div className="hire-chips form-chips">{crafts.map(craft => <button type="button" key={craft} className={f.crafts.includes(craft) ? "selected" : ""} onClick={() => toggleCraft(craft)}>{craft}</button>)}</div>
              <label>Custom skills (comma separated)<input value={f.skills} onChange={e => set("skills", e.target.value)} placeholder="Luau, DataStore, UI animation" /></label>
              <div className="form-section-title"><h2>Services</h2><button type="button" className="subtle-button" onClick={() => set("services", [...f.services, { title: "", description: "", price: 0 }].slice(0, 12))} disabled={f.services.length >= 12}><Plus size={14} /> Add service</button></div>
              {f.services.map((service, index) => <div className="service-form-row" key={index}>
                <label>Title<input required maxLength={80} value={service.title} onChange={e => set("services", f.services.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} /></label>
                <label>Description<input maxLength={240} value={service.description} onChange={e => set("services", f.services.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} /></label>
                <label>Starting price (USD)<input type="number" min="0" max="100000" value={service.price} onChange={e => set("services", f.services.map((item, i) => i === index ? { ...item, price: Number(e.target.value) } : item))} /></label>
                {f.services.length > 1 && <button type="button" className="remove-button" onClick={() => set("services", f.services.filter((_, i) => i !== index))} aria-label="Remove service"><Trash2 size={14}/></button>}
              </div>)}
              <div className="form-two">
                <label>Rate type<select value={f.rateType} onChange={e => set("rateType", e.target.value)}><option value="hourly">Hourly</option><option value="project">Per project</option><option value="negotiable">Negotiable</option></select></label>
                {f.rateType !== "negotiable" && <label>Rate amount (USD)<input type="number" min="0" max="100000" value={f.rateAmount} onChange={e => set("rateAmount", e.target.value)} /></label>}
              </div>
              <label>Availability<select value={f.availability} onChange={e => set("availability", e.target.value)}><option>Available</option><option>Busy</option><option>Not taking commissions</option></select></label>
              <div className="form-section-title"><h2>Portfolio</h2><span className="muted-copy">3–9 HTTPS image links</span></div>
              {f.portfolio.map((item, index) => <div className="portfolio-form-row" key={index}>
                <label>Image URL<input required type="url" value={item.url} onChange={e => set("portfolio", f.portfolio.map((p, i) => i === index ? { ...p, url: e.target.value } : p))} placeholder="https://…" /></label>
                <label>Caption<input maxLength={120} value={item.caption} onChange={e => set("portfolio", f.portfolio.map((p, i) => i === index ? { ...p, caption: e.target.value } : p))} placeholder="What did you create?" /></label>
                {f.portfolio.length > 3 && <button type="button" className="remove-button" onClick={() => set("portfolio", f.portfolio.filter((_, i) => i !== index))} aria-label="Remove portfolio item"><Trash2 size={14}/></button>}
              </div>)}
              {f.portfolio.length < 9 && <button type="button" className="subtle-button" onClick={() => set("portfolio", [...f.portfolio, { url: "", caption: "" }])}><Plus size={14}/> Add portfolio image</button>}
              <label>Optional video link<input type="url" value={f.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://…" /></label>
              <div className="form-two">
                <label>Discord username<input required maxLength={80} value={f.discordUsername} onChange={e => set("discordUsername", e.target.value)} /></label>
                <label>Roblox profile URL<input required type="url" value={f.robloxUrl} onChange={e => set("robloxUrl", e.target.value)} placeholder="https://www.roblox.com/users/…/profile" /></label>
              </div>
              <label className="own-work-check"><input type="checkbox" checked={f.ownWork} onChange={e => set("ownWork", e.target.checked)} /> I confirm this is my own work and I have permission to share these images.</label>
              {error && <p className="form-error" role="alert">{error}</p>}
              {feedback && <p className="form-disclaimer" role="status">{feedback}</p>}
              <p className="form-disclaimer">Applications are stored privately. No public developer profile is created until approval.</p>
              <div className="developer-application-actions">
                <button type="button" className="hire-secondary" disabled={busy} onClick={() => void save("draft")}><Save size={14}/>{busy ? "Saving…" : "Save draft"}</button>
                <button className="hire-primary" disabled={busy}>{busy ? "Submitting…" : "Submit for review"} <Send size={14}/></button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
