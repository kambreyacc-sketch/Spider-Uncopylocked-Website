"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImagePlus, MessageSquare, RefreshCw, Send, Ticket, X } from "lucide-react";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
type TicketRow = { _id: string; ticketNumber: string; category: string; subject: string; description?: string; status: string; priority: string; createdAt: number; updatedAt: number };
type TicketMessage = { _id: string; authorName: string; authorDiscordId: string; body: string; attachments?: string[]; visibility: string; createdAt: number };
type TicketDetail = { ticket: TicketRow; messages: TicketMessage[] };

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/support/tickets", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load tickets.");
      setTickets(data.tickets || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tickets.");
    } finally { setLoading(false); }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch("/api/support/tickets/" + encodeURIComponent(id), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not open ticket.");
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open ticket.");
      setDetail(null);
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => {
    void loadTickets();
    const openId = new URLSearchParams(window.location.search).get("open");
    if (openId) setSelectedId(openId);
  }, [loadTickets]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
      window.history.replaceState({}, "", "/support/tickets");
    } else {
      setDetail(null);
      setReply("");
      setAttachments([]);
    }
  }, [selectedId, loadDetail]);

  async function pickImages(files: FileList | null) {
    if (!files) return;
    const chosen = Array.from(files).slice(0, 3);
    if (chosen.some(file => !file.type.startsWith("image/") || file.size > 200 * 1024)) {
      setError("Choose up to 3 images, each no larger than 200 KB.");
      return;
    }
    try {
      const encoded = await Promise.all(chosen.map(file => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image."));
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      })));
      setAttachments(current => [...current, ...encoded].slice(0, 3));
      setError("");
    } catch { setError("Could not read one of those images."); }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/tickets/" + encodeURIComponent(selectedId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply, attachments }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send reply.");
      setReply(""); setAttachments([]);
      await Promise.all([loadDetail(selectedId), loadTickets()]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send reply."); }
    finally { setBusy(false); }
  }

  async function closeTicket() {
    if (!selectedId || !detail || detail.ticket.status === "closed") return;
    if (!window.confirm("Close this support thread? You can still read it, but you will need a new ticket for more help.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/tickets/" + encodeURIComponent(selectedId), { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not close ticket.");
      await Promise.all([loadDetail(selectedId), loadTickets()]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not close ticket."); }
    finally { setBusy(false); }
  }

  function closeThread() {
    setSelectedId("");
    setDetail(null);
    setError("");
    router.replace("/support/tickets", { scroll: false });
  }

  return <main className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/support" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft size={15}/> Support Center</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[.22em] text-white/40">Member portal</p><h1 className="mt-2 text-3xl font-semibold">My tickets</h1><p className="mt-2 text-sm text-white/50">Your private support threads stay inside Spider Uncopylocked.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void loadTickets()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65 disabled:opacity-50"><RefreshCw size={15}/> Refresh</button><Link href="/support" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">New ticket</Link></div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200/20 bg-red-100/[.05] p-4 text-sm text-red-100/80">{error}</p>}
      {loading ? <div className="mt-6 rounded-2xl border border-white/10 p-8 text-sm text-white/50">Loading your tickets…</div> : tickets.length === 0 ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-10 text-center"><Ticket size={28} className="mx-auto text-white/35"/><h2 className="mt-3 font-semibold">No tickets yet</h2><p className="mt-2 text-sm text-white/45">Create a request and your private conversation will appear here.</p><Link href="/support" className="mt-5 inline-flex rounded-xl border border-white/15 px-4 py-2.5 text-sm">Visit Support Center</Link></div> : <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-3">
          {tickets.map(ticket => <button type="button" key={ticket._id} onClick={() => setSelectedId(ticket._id)} className={"block w-full rounded-2xl border p-5 text-left transition " + (selectedId === ticket._id ? "border-white/30 bg-white/[.07]" : "border-white/10 bg-gradient-to-b from-[#191919] to-[#101010] hover:border-white/25")}>
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-white/45">{ticket.ticketNumber} · {ticket.category}</span><span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">{label(ticket.status)}</span></div>
            <h2 className="mt-3 font-semibold">{ticket.subject}</h2><p className="mt-2 text-xs text-white/40">Updated {new Date(ticket.updatedAt).toLocaleString()}</p>
          </button>)}
        </section>
        <aside className="h-fit rounded-2xl border border-white/10 bg-gradient-to-b from-[#191919] to-[#101010] p-5"><MessageSquare size={20} className="text-white/60"/><h2 className="mt-3 font-semibold">Private support threads</h2><p className="mt-2 text-sm leading-6 text-white/45">Select a ticket to open its conversation panel. Only your Discord account and authorized support staff can access its messages and attachments.</p></aside>
      </div>}
    </div>

    {selectedId && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) closeThread(); }}>
      <section role="dialog" aria-modal="true" aria-label="Private support thread" className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#101010] shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#202020] to-[#111] p-5">
          <div className="min-w-0"><p className="text-xs uppercase tracking-[.2em] text-white/40">Private thread · Spider Uncopylocked</p><h2 className="mt-2 truncate text-xl font-semibold">{detail?.ticket.subject || "Opening ticket…"}</h2>{detail && <p className="mt-1 text-xs text-white/45">{detail.ticket.ticketNumber} · {detail.ticket.category} · {label(detail.ticket.status)}</p>}</div>
          <button type="button" onClick={closeThread} aria-label="Close thread panel" className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/[.06] hover:text-white"><X size={18}/></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {detailLoading || !detail ? <div className="py-12 text-center text-sm text-white/50">Loading private conversation…</div> : <>
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/40">Original request</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{detail.ticket.description}</p></div>
            <div className="mt-5 space-y-3">{detail.messages.map((message, index) => <article key={message._id || index} className="rounded-xl border border-white/10 bg-[#171717] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{message.authorName}</b><time className="text-xs text-white/40">{new Date(message.createdAt).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{message.body}</p>{message.attachments?.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{message.attachments.map((src, i) => <a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} alt={"Ticket attachment " + (i + 1)} className="max-h-48 w-full rounded-lg border border-white/10 object-contain"/></a>)}</div> : null}</article>)}</div>
          </>}
        </div>
        {detail && <footer className="border-t border-white/10 bg-[#0d0d0d] p-4 sm:p-5">
          {detail.ticket.status === "closed" ? <p className="rounded-xl border border-white/10 p-3 text-sm text-white/50">This ticket is closed. You can still read the thread or create a new ticket.</p> : <form onSubmit={sendReply} className="space-y-3">
            <textarea required maxLength={5000} rows={3} value={reply} onChange={event => setReply(event.target.value)} className="w-full resize-y rounded-xl border border-white/10 bg-[#080808] p-3 text-sm outline-none focus:border-white/30" placeholder="Reply in this private thread…"/>
            <div className="flex flex-wrap items-center justify-between gap-3"><label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/50 hover:text-white/80"><ImagePlus size={15}/> Attach images<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={event => void pickImages(event.target.files)} className="sr-only"/></label><span className="text-xs text-white/35">{attachments.length}/3 images · 200 KB each</span></div>
            {attachments.length > 0 && <div className="flex flex-wrap gap-2">{attachments.map((src, i) => <button key={i} type="button" onClick={() => setAttachments(current => current.filter((_, index) => index !== i))} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60">Image {i + 1} · Remove</button>)}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => void closeTicket()} disabled={busy} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65 hover:bg-white/[.05] disabled:opacity-50">{busy ? "Saving…" : "Close ticket"}</button><button type="submit" disabled={busy || !reply.trim()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Sending…" : "Send reply"} <Send size={14}/></button></div>
          </form>}
        </footer>}
      </section>
    </div>}
  </main>;
}
