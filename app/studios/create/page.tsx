"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import SpiderSidebar from "../../components/SpiderSidebar";
import { ArrowLeft, Building2, CheckCircle2, LoaderCircle } from "lucide-react";

export default function CreateStudioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState("Scripting, Building, UI");
  const [robloxUrl, setRobloxUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, specialties, robloxUrl, discordUrl }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "We could not submit your studio request. Please try again.");
        return;
      }
      setSuccess(true);
      setMessage("Studio application #" + result.applicationNumber + " submitted. Your studio will be created only after an authorized reviewer approves the request.");
      router.push("/applications?submitted=" + encodeURIComponent(result.applicationNumber));
      router.refresh();
    } catch {
      setMessage("The application service could not be reached. Your request was not saved; please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content form-page">
        <Link href="/studios" className="hire-back"><ArrowLeft size={14} /> Back to studios</Link>
        <header className="hire-page-head">
          <div>
            <span className="spider-eyebrow">SPIDER / STUDIO SETUP</span>
            <h1>Create a studio</h1>
            <p>Submit a studio profile for review. It will appear in the directory only after approval.</p>
          </div>
        </header>
        <form className="hire-form" onSubmit={submit}>
          <label>
            Studio name
            <input required minLength={3} maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Spider Interactive" />
          </label>
          <label>
            Studio handle
            <input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9]+([a-zA-Z0-9-]{1,30}[a-zA-Z0-9])" value={slug} onChange={event => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="spider-interactive" />
            <small>3–32 lowercase letters, numbers, or hyphens. This becomes your studio URL handle.</small>
          </label>
          <label>
            About your studio
            <textarea required minLength={20} maxLength={1200} rows={5} value={description} onChange={event => setDescription(event.target.value)} placeholder="What do you build? What makes your team different?" />
            <small>{description.length}/1,200 characters</small>
          </label>
          <label>
            Specialties
            <input required value={specialties} onChange={event => setSpecialties(event.target.value)} placeholder="Scripting, building, UI, VFX" />
            <small>Separate specialties with commas.</small>
          </label>
          <label>
            Roblox group or game link <span className="form-optional">Optional</span>
            <input type="url" value={robloxUrl} onChange={event => setRobloxUrl(event.target.value)} placeholder="https://www.roblox.com/groups/…" />
          </label>
          <label>
            Discord invite <span className="form-optional">Optional</span>
            <input type="url" value={discordUrl} onChange={event => setDiscordUrl(event.target.value)} placeholder="https://discord.gg/…" />
          </label>
          <button type="submit" className="hire-primary" disabled={saving}>
            {saving ? <LoaderCircle size={15} className="spin" /> : success ? <CheckCircle2 size={15} /> : <Building2 size={15} />}
            {saving ? "Submitting request…" : "Submit studio request"}
          </button>
          {message && <p role="status" className="form-disclaimer">{message}</p>}
        </form>
      </section>
    </main>
  );
}
