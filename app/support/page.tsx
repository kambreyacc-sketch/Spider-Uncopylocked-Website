import Link from "next/link";
import { ArrowLeft, ShieldCheck, Ticket, MessageSquareWarning, FileText, Wrench, Building2 } from "lucide-react";
const categories = [
  { title: "Account Appeal", description: "Appeal a moderation action or website restriction.", icon: ShieldCheck },
  { title: "Report a Scammer", description: "Report suspicious users, listings, or transactions.", icon: MessageSquareWarning },
  { title: "Report Content", description: "Flag a resource, profile, or listing for review.", icon: FileText },
  { title: "Technical Support", description: "Get help with a broken page or feature.", icon: Wrench },
  { title: "Studio Request", description: "Ask about a studio profile or studio access.", icon: Building2 },
  { title: "General Support", description: "Ask the team about another issue.", icon: Ticket },
];
export default function SupportPage() {
  return <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f2f2f2] sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16}/> Back to Spider Uncopylocked</Link>
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#252525] via-[#141414] to-[#090909] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_24px_80px_rgba(0,0,0,.35)] sm:p-10"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,.09),transparent_48%)]"/><div className="relative max-w-2xl"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[.06]"><Ticket size={23}/></div><p className="text-xs font-semibold uppercase tracking-[.24em] text-white/45">Spider Uncopylocked</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Support Center</h1><p className="mt-4 text-sm leading-6 text-white/60 sm:text-base">Private support requests connected to your signed-in Discord account. Replies and status updates are saved to your ticket.</p></div></section>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Create a ticket</h2><p className="mt-1 text-sm text-white/50">Choose a category to begin.</p></div><Link href="/support/tickets" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70 hover:bg-white/[.08]">My tickets →</Link></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(({title,description,icon:Icon})=><Link key={title} href={`/support/new?category=${encodeURIComponent(title)}`} className="group rounded-2xl border border-white/10 bg-gradient-to-b from-[#1c1c1c] to-[#101010] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition hover:-translate-y-0.5 hover:border-white/25"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-white/80"><Icon size={19}/></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-white/50">{description}</p><span className="mt-5 inline-flex gap-2 text-sm text-white/75">Start request →</span></Link>)}</div>
  </div></main>;
}
