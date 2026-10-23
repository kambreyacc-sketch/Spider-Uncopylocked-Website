"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, RefreshCw, Search, ShieldAlert, X } from "lucide-react";

type Entry = Record<string, any> & { _id: string; status: string; createdAt: number; entityType: "listing" | "job" | "studio" };
type Queue = { listings: Entry[]; jobs: Entry[]; studios: Entry[]; counts: Record<string, Record<string, number>> };
const tabs = [
  { id: "listing", label: "Game marketplace", plural: "listings" },
  { id: "job", label: "Job posts", plural: "jobs" },
  { id: "studio", label: "Studios", plural: "studios" },
] as const;
type EntityType = typeof tabs[number]["id"];
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

export default function PublishingModerationPanel({ initialTab = "listing" }: { initialTab?: EntityType }) {
  const [data, setData] = useState<Queue | null>(null);
  const [tab, setTab] = useState<EntityType>(initialTab);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [rejectId, setRejectId] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/publishing", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load moderation queue.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load moderation queue."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    const key = tabs.find(t => t.id === tab)!.plural;
    const term = search.trim().toLowerCase();
    return ((data?.[key] || []) as Entry[]).filter(item => {
      const statusMatches = filter === "all" || item.status === filter;
      const text = [item.title, item.name, item.slug, item.description, item.sellerName, item.posterName, item.ownerName, item.craft, item.type].filter(Boolean).join(" ").toLowerCase();
      return statusMatches && (!term || text.includes(term));
    });
  }, [data, tab, filter, search]);

  async function decide(item: Entry, decision: "approve" | "reject", decisionReason?: string) {
    setBusyId(item._id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/publishing", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: item.entityType, entityId: item._id, decision, reason: decisionReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the decision.");
      setRejectId(""); setReason("");
      if (decision === "approve") {
        setFilter(item.entityType === "job" ? "open" : "active");
        setNotice(`Approved “${item.title || item.name || "submission"}” and published it. You are now viewing published items.`);
      } else {
        setFilter("rejected");
        setNotice(`Rejected “${item.title || item.name || "submission"}”. It remains unpublished.`);
      }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the decision."); }
    finally { setBusyId(""); }
  }

  return <section className="space-y-5">
    <div className="rounded-xl border border-white/10 bg-[#111113] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="text-xs font-semibold uppercase tracking-[.2em] text-white/40">Publishing controls</span><h2 className="mt-2 text-2xl font-semibold">Review before publishing</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">New game listings, job posts, and studio registrations stay hidden until an authorized admin approves them. Existing approved posts remain visible.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 disabled:opacity-40"><RefreshCw size={15}/>{loading ? "Loading" : "Refresh"}</button>
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-3">{tabs.map(item => <button type="button" key={item.id} onClick={() => { setTab(item.id); setFilter("pending"); setRejectId(""); setReason(""); }} className={"rounded-xl border p-4 text-left transition " + (tab === item.id ? "border-white/35 bg-white/[.08]" : "border-white/10 bg-white/[.025] hover:bg-white/[.05]")}><span className="text-sm font-medium">{item.label}</span><strong className="mt-2 block text-2xl">{loading ? "—" : data?.counts?.[item.plural]?.pending ?? 0}</strong><span className="text-xs text-white/45">Waiting for review</span></button>)}</div>
    <div className="flex flex-wrap gap-3"><label className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, owner, description…" className="w-full rounded-xl border border-white/10 bg-[#141414] py-3 pl-9 pr-3 text-sm outline-none focus:border-white/30"/></label><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm">{(tab === "job" ? ["pending", "open", "rejected", "closed"] : ["pending", "active", "rejected"]).map(s => <option key={s} value={s}>{s === "active" ? "Approved / published" : label(s)}</option>)}<option value="all">All statuses</option></select></div>
    {notice && <div role="status" className="rounded-xl border border-white/15 bg-white/[.05] p-4 text-sm text-white/85">{notice}</div>}
    {error && <div role="alert" className="rounded-xl border border-red-200/20 bg-red-100/[.05] p-4 text-sm text-red-100/80">{error}</div>}
    {loading ? <div className="rounded-2xl border border-white/10 p-8 text-sm text-white/45">Loading saved submissions…</div> : rows.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[.02] p-10 text-center"><ShieldAlert size={28} className="mx-auto text-white/35"/><h3 className="mt-3 font-semibold">No matching submissions</h3><p className="mt-1 text-sm text-white/45">{filter === "pending" ? "New submissions will appear here for review." : "No records match these filters."}</p></div> :
      <div className="grid gap-4 lg:grid-cols-2">{rows.map(item => {
        const title = item.title || item.name || "Untitled submission";
        const owner = item.sellerName || item.posterName || item.ownerName || "Unknown creator";
        const status = item.status;
        return <article key={item._id} className="rounded-xl border border-white/10 bg-[#111113] p-5">
          <div className="flex items-start justify-between gap-3"><div><span className="text-xs uppercase tracking-wide text-white/40">{item.entityType} · {item.type || item.craft || (item.specialties || []).join(", ")}</span><h3 className="mt-1 text-lg font-semibold">{title}</h3></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">{label(status)}</span></div>
          {item.imageUrl && <img src={item.imageUrl} alt={title + " preview"} className="mt-4 max-h-48 w-full rounded-xl border border-white/10 object-cover"/>}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-white/60">{item.description || "No description provided."}</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/55"><p><b className="text-white/75">Submitted by:</b> {owner}</p>{item.price !== undefined && <p><b className="text-white/75">Price:</b> {"$" + Number(item.price).toLocaleString()}</p>}{item.budgetMin !== undefined && <p><b className="text-white/75">Budget:</b> {"$" + Number(item.budgetMin).toLocaleString() + "–$" + Number(item.budgetMax).toLocaleString()}</p>}{item.robloxUrl && <p className="break-all"><b className="text-white/75">Roblox:</b> {item.robloxUrl}</p>}{item.discordUrl && <p className="break-all"><b className="text-white/75">Discord:</b> {item.discordUrl}</p>}<p><b className="text-white/75">Submitted:</b> {new Date(item.createdAt).toLocaleString()}</p></div>
          {status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void decide(item, "approve")} disabled={!!busyId} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">{busyId === item._id ? "Saving…" : <><Check size={15}/> Approve & publish</>}</button>{rejectId === item._id ? <div className="w-full space-y-2 pt-2"><label className="block text-xs text-white/55">Rejection reason<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080808] p-3 text-sm outline-none focus:border-white/30" placeholder="Explain what needs to change…"/></label><div className="flex gap-2"><button type="button" onClick={() => void decide(item, "reject", reason.trim())} disabled={!!busyId || reason.trim().length < 1} className="rounded-xl border border-red-100/20 px-4 py-2 text-sm text-red-100 disabled:opacity-40">Confirm rejection</button><button type="button" onClick={() => { setRejectId(""); setReason(""); }} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"><X size={13} className="mr-1 inline"/>Cancel</button></div></div> : <button type="button" onClick={() => { setRejectId(item._id); setReason(""); }} disabled={!!busyId} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65 disabled:opacity-40">Reject</button>}</div>}
          {status !== "pending" && <p className="mt-4 flex items-center gap-2 text-xs text-white/40"><Clock3 size={13}/> {status === "rejected" ? "Not published" : "Already published or closed"}</p>}
        </article>;
      })}</div>}
    <p className="text-xs leading-5 text-white/35">Approvals are recorded in the admin audit log. Rejecting a submission keeps it out of public results.</p>
  </section>;
}
