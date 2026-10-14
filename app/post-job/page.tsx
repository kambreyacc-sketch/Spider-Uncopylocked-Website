"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import SpiderSidebar from "../components/SpiderSidebar";
import {
  ArrowLeft, ArrowRight, Blocks, Check, Code2, Cuboid, Image, Music2,
  Palette, PersonStanding, Send, Sparkles, X,
} from "lucide-react";

const crafts = [
  { name: "Scripting", Icon: Code2, detail: "Gameplay systems and Luau" },
  { name: "Building", Icon: Blocks, detail: "Maps and environments" },
  { name: "UI/UX", Icon: Palette, detail: "Interfaces and player flows" },
  { name: "3D Modeling", Icon: Cuboid, detail: "Props and game assets" },
  { name: "Animation", Icon: PersonStanding, detail: "Characters and motion" },
  { name: "VFX", Icon: Sparkles, detail: "Particles and effects" },
  { name: "GFX", Icon: Image, detail: "Thumbnails and visual art" },
  { name: "Audio", Icon: Music2, detail: "Music and sound design" },
];
const steps = ["Role", "Details", "Budget", "Contact"];

export default function PostJobPage() {
  const post = useMutation(api.developers.postJob);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    craft: "Scripting",
    budgetMin: "0",
    budgetMax: "100",
    deadline: "",
    discordContact: "",
    posterName: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setUser(data.user || null);
        if (data.user) {
          setForm((current) => ({
            ...current,
            posterName: current.posterName || data.user.displayName || data.user.username || "",
            discordContact: current.discordContact || data.user.username || "",
          }));
        }
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  function validateStep(index: number) {
    if (index === 1) {
      if (form.title.trim().length < 5) return "Add a job title with at least 5 characters.";
      if (!form.description.trim()) return "Add a short description of the work.";
    }
    if (index === 2) {
      const min = Number(form.budgetMin);
      const max = Number(form.budgetMax);
      if (form.budgetMin === "" || form.budgetMax === "" || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min || max > 1000000) {
        return "Enter a valid USD budget range. The maximum must be at least the minimum.";
      }
      if (form.deadline) {
        const parsedDeadline = new Date(form.deadline + "T23:59:59");
        if (Number.isNaN(parsedDeadline.getTime()) || parsedDeadline.getTime() < Date.now()) {
          return "The deadline must be today or a future date.";
        }
      }
    }
    if (index === 3) {
      if (!form.discordContact.trim()) return "Add the Discord username developers should contact.";
      if (!form.posterName.trim()) return "Add a display name for the post.";
    }
    return "";
  }

  function nextStep() {
    const problem = validateStep(step);
    if (problem) { setError(problem); return; }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) { nextStep(); return; }
    const problem = validateStep(step);
    if (problem) { setError(problem); return; }
    if (!user) { window.location.href = "/api/auth/discord/login"; return; }
    setBusy(true);
    setError("");
    try {
      await post({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        deadline: form.deadline || undefined,
        discordContact: form.discordContact.trim(),
        posterDiscordId: user.id,
        posterName: form.posterName.trim() || user.displayName || user.username,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Could not post the job. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content form-page job-wizard-page">
        <Link href="/jobs" className="hire-back"><ArrowLeft size={15} /> Back to jobs</Link>
        <div className="job-wizard-page-heading">
          <div>
            <span className="spider-eyebrow">SPIDER / BUSINESS</span>
            <h1>Post a job</h1>
            <p>Give creators enough detail to decide whether this project is right for them.</p>
          </div>
          <Link href="/jobs" className="job-wizard-close" aria-label="Cancel and close job wizard" title="Cancel and close"><X size={18} /></Link>
        </div>

        {done ? (
          <div className="hire-empty job-wizard-success">
            <span className="job-wizard-success-icon"><Check size={22} /></span>
            <h2>Job posted</h2>
            <p>Your post was submitted to the existing Spider jobs system.</p>
            <Link href="/jobs" className="hire-primary">View jobs <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <form className="job-wizard" onSubmit={submit}>
            <div className="job-wizard-progress">
              <div className="job-wizard-progress-bars" aria-hidden="true">
                {steps.map((label, index) => <span key={label} className={index <= step ? "complete" : ""} />)}
              </div>
              <div className="job-wizard-progress-labels">
                {steps.map((label, index) => <span key={label} className={index === step ? "current" : index < step ? "complete" : ""}>{index + 1}. {label}</span>)}
              </div>
            </div>

            {step === 0 && (
              <section className="job-wizard-step">
                <div className="job-wizard-step-heading"><span>STEP 01</span><h2>Who do you need?</h2><p>Choose the primary skill for this opportunity.</p></div>
                <div className="job-role-grid">
                  {crafts.map(({ name, Icon, detail }) => (
                    <button type="button" key={name} className={"job-role-tile" + (form.craft === name ? " selected" : "")} onClick={() => update("craft", name)} aria-pressed={form.craft === name}>
                      <Icon size={19} strokeWidth={1.7} />
                      <b>{name}</b>
                      <small>{detail}</small>
                      {form.craft === name && <span className="job-role-check"><Check size={12} /></span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="job-wizard-step">
                <div className="job-wizard-step-heading"><span>STEP 02</span><h2>What’s the job?</h2><p>A specific title and scope help the right developers respond.</p></div>
                <label className="job-wizard-field">Job title
                  <input autoFocus required minLength={5} maxLength={100} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Build a simulator map" />
                  <small>{form.title.length}/100 characters</small>
                </label>
                <label className="job-wizard-field">Project details
                  <textarea required maxLength={3000} rows={7} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Scope, deliverables, required experience, and what success looks like..." />
                  <small>{form.description.length}/3000 characters</small>
                </label>
              </section>
            )}

            {step === 2 && (
              <section className="job-wizard-step">
                <div className="job-wizard-step-heading"><span>STEP 03</span><h2>What’s the budget?</h2><p>Spider currently supports a USD budget range for job posts.</p></div>
                <div className="job-budget-preview">
                  <span className="job-budget-preview-label">SELECTED ROLE</span>
                  <strong>{form.craft}</strong>
                  <span className="job-budget-preview-label">BUDGET RANGE</span>
                  <strong>${Number(form.budgetMin || 0).toLocaleString()} – ${Number(form.budgetMax || 0).toLocaleString()} USD</strong>
                </div>
                <div className="form-two job-wizard-budget-fields">
                  <label className="job-wizard-field">Minimum budget (USD)
                    <input type="number" inputMode="decimal" min="0" max="1000000" required value={form.budgetMin} onChange={(event) => update("budgetMin", event.target.value)} />
                  </label>
                  <label className="job-wizard-field">Maximum budget (USD)
                    <input type="number" inputMode="decimal" min="0" max="1000000" required value={form.budgetMax} onChange={(event) => update("budgetMax", event.target.value)} />
                  </label>
                </div>
                <label className="job-wizard-field">Deadline <span className="field-optional">Optional</span>
                  <input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} />
                </label>
                <p className="job-wizard-note">Spider does not process or hold job payments. Agree on scope and payment milestones directly with the creator.</p>
              </section>
            )}

            {step === 3 && (
              <section className="job-wizard-step">
                <div className="job-wizard-step-heading"><span>STEP 04</span><h2>Review and publish</h2><p>Make sure creators know who is hiring and how to contact you.</p></div>
                <label className="job-wizard-field">Discord contact
                  <input required maxLength={80} value={form.discordContact} onChange={(event) => update("discordContact", event.target.value)} placeholder="Your Discord username" />
                </label>
                <label className="job-wizard-field">Display name
                  <input required maxLength={40} value={form.posterName} onChange={(event) => update("posterName", event.target.value)} />
                </label>
                <div className="job-review-card">
                  <div className="job-review-top"><span>{form.craft}</span><span>USD budget</span></div>
                  <h3>{form.title || "Untitled job"}</h3>
                  <p>{form.description || "No project details provided."}</p>
                  <div className="job-review-bottom"><strong>${Number(form.budgetMin || 0).toLocaleString()} – ${Number(form.budgetMax || 0).toLocaleString()}</strong><span>{form.deadline ? "Deadline " + form.deadline : "No deadline set"}</span></div>
                  <small>Posting as {form.posterName || user?.displayName || "Your account"} · Contact @{form.discordContact || user?.username || "your Discord"}</small>
                </div>
                <p className="job-wizard-note">By publishing, you confirm that your job details are accurate. Never share passwords or .ROBLOSECURITY cookies.</p>
              </section>
            )}

            {error && <p className="form-error job-wizard-error" role="alert">{error}</p>}
            <div className="job-wizard-footer">
              {step > 0 ? <button type="button" className="job-wizard-back" onClick={() => { setStep((current) => current - 1); setError(""); }}><ArrowLeft size={15} /> Back</button> : <Link href="/jobs" className="job-wizard-back">Cancel</Link>}
              <span className="job-wizard-footer-spacer" />
              {step < steps.length - 1 ? (
                <button type="button" className="hire-primary" onClick={nextStep}>Next <ArrowRight size={15} /></button>
              ) : (
                <button type="submit" className="hire-primary" disabled={busy}>{busy ? "Publishing…" : "Publish job"} <Send size={14} /></button>
              )}
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
