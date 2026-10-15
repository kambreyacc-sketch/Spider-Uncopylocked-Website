"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Upload, Info } from "lucide-react";

const categories = ["Account Appeal", "Report a Scammer", "Report Content", "Technical Support", "Studio Request", "General Support"];

export default function NewSupportTicketPage() {
  const params = useSearchParams();
  const initialCategory = params.get("category") || "Account Appeal";
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "Account Appeal");
  const [subject, setSubject] = useState("");
  const [reference, setReference] = useState("");
  const [department, setDepartment] = useState("");
  const [action, setAction] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");
  const referenceLabel = useMemo(() => category === "Account Appeal" ? "Infraction ID (optional)" : category === "Report a Scammer" ? "Username or profile URL" : category === "Report Content" ? "Content URL" : category === "Studio Request" ? "Studio name" : category === "Technical Support" ? "Page or feature affected" : "Related link (optional)", [category]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("This form is ready for review, but ticket creation is not connected to the database yet. No ticket was submitted or saved.");
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f2f2f2] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/support" className="mb-7 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"><ArrowLeft size={16}/> Support Center</Link>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,.35)] md:grid md:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="relative hidden border-r border-white/10 bg-gradient-to-b from-[#202020] to-[#101010] p-7 md:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.15)]"><ShieldCheck size={24}/></div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.22em] text-white/40">Spider Support</p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight">Submit a request</h1>
            <p className="mt-3 text-sm leading-6 text-white/50">Give the team enough information to understand your request. Sensitive reports should only include relevant evidence.</p>
            <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-white/45">Never include passwords, payment-card details, or unrelated personal information.</div>
          </aside>
          <section className="p-5 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/40">New ticket</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Tell us what you need help with</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Fields marked with * are required.</p>
            <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-white/85">Ticket category <span className="text-white/50">*</span></label>
                <select id="category" required value={category} onChange={(e) => { setCategory(e.target.value); setNotice(""); }} className="w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40">
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <p className="text-xs leading-5 text-white/40">Choose the team best suited to review your request.</p>
              </div>
              {category === "Account Appeal" && <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><label htmlFor="department" className="block text-sm font-medium text-white/85">Department / area <span className="text-white/50">*</span></label><select id="department" required value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm text-white outline-none focus:border-white/40"><option value="">Choose a department…</option><option>Website Moderation</option><option>Marketplace</option><option>Resource Library</option><option>Developer / Studio</option><option>Other</option></select></div>
                <div className="space-y-2"><label htmlFor="action" className="block text-sm font-medium text-white/85">Action taken <span className="text-white/50">*</span></label><select id="action" required value={action} onChange={(e) => setAction(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm text-white outline-none focus:border-white/40"><option value="">Choose an action…</option><option>Warning</option><option>Posting restriction</option><option>Upload restriction</option><option>Temporary suspension</option><option>Permanent suspension</option><option>Content removal</option><option>Other</option></select></div>
              </div>}
              <div className="space-y-2"><label htmlFor="subject" className="block text-sm font-medium text-white/85">Subject <span className="text-white/50">*</span></label><input id="subject" required maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly summarize your request" className="w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/40"/></div>
              <div className="space-y-2"><label htmlFor="reference" className="block text-sm font-medium text-white/85">{referenceLabel}{category === "Account Appeal" || category === "General Support" ? "" : " *"}</label><input id="reference" required={category !== "Account Appeal" && category !== "General Support"} maxLength={300} value={reference} onChange={(e) => setReference(e.target.value)} placeholder={category === "Account Appeal" ? "Enter the infraction ID if you have it" : "Enter a username, link, or reference"} className="w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/40"/>{category === "Account Appeal" && <p className="text-xs leading-5 text-white/40">If you do not know the infraction ID, leave this blank and explain the situation below.</p>}</div>
              <div className="space-y-2"><label htmlFor="description" className="block text-sm font-medium text-white/85">{category === "Account Appeal" ? "Appeal explanation" : "Description"} <span className="text-white/50">*</span></label><textarea id="description" required minLength={20} maxLength={5000} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={category === "Account Appeal" ? "Explain why you believe the action should be reconsidered. Include relevant context and any evidence." : "Describe what happened and include relevant details."} className="w-full resize-y rounded-xl border border-white/15 bg-[#1b1b1b] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/30 outline-none transition focus:border-white/40"/><p className="text-right text-xs text-white/35">{description.length}/5000</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-start gap-3"><Info size={17} className="mt-0.5 shrink-0 text-white/55"/><p className="text-xs leading-5 text-white/50">Attachments and authenticated account details will be handled by the ticket backend once connected. Do not include sensitive credentials in this form.</p></div></div>
              {notice && <div role="status" className="rounded-xl border border-amber-200/20 bg-amber-100/[.05] p-4 text-sm leading-6 text-amber-100/80">{notice}</div>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><Link href="/support" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65 transition hover:bg-white/[.05]">Cancel</Link><button type="submit" className="rounded-xl border border-white/20 bg-gradient-to-b from-[#f0f0f0] to-[#bdbdbd] px-5 py-3 text-sm font-semibold text-[#111] shadow-[inset_0_1px_0_white] transition hover:brightness-110">Validate form</button></div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
