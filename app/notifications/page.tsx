"use client";

import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";

type Notification = {
  _id: string;
  category: "support" | "application" | "moderation" | "system";
  title: string;
  body: string;
  href?: string;
  createdAt: number;
  readAt?: number;
};

function safeHref(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const auth = await fetch("/api/auth/discord/me", { cache: "no-store" }).then(r => r.json());
      if (!auth.user) { setUser(false); setItems([]); setUnreadCount(0); return; }
      setUser(true);
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notifications could not be loaded.");
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(id: string) {
    setBusy(id); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not mark notification as read.");
      setItems(current => current.map(item => item._id === id ? { ...item, readAt: Date.now() } : item));
      setUnreadCount(current => Math.max(0, current - (items.some(item => item._id === id && !item.readAt) ? 1 : 0)));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update notification."); }
    finally { setBusy(null); }
  }

  async function markAllRead() {
    setBusy("all"); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "readAll" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not mark notifications as read.");
      const now = Date.now();
      setItems(current => current.map(item => ({ ...item, readAt: item.readAt || now })));
      setUnreadCount(0);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update notifications."); }
    finally { setBusy(null); }
  }

  async function openNotification(item: Notification) {
    if (!item.readAt) await markRead(item._id);
    window.location.assign(safeHref(item.href));
  }

  return (
    <main className="market-shell notifications-page">
      <SpiderSidebar />
      <section className="market-content notifications-content">
        <header className="hire-page-head notifications-page-header">
          <div><span className="spider-eyebrow">SPIDER / YOUR ACCOUNT</span><h1>Notifications</h1><p>Important updates about tickets, applications, moderation, and your account.</p></div>
          <div className="notification-unread-pill"><Bell size={15}/>{unreadCount} unread</div>
        </header>
        {error && <div className="support-feedback" role="alert"><ShieldAlert size={15}/><span>{error}</span></div>}
        <div className="notifications-toolbar">
          <span>{items.length} recent notifications</span>
          <div><button type="button" className="hire-secondary" disabled={loading || busy==="all" || unreadCount===0} onClick={() => void markAllRead()}><CheckCheck size={14}/>{busy==="all"?"Saving…":"Mark all read"}</button><button type="button" className="hire-secondary" disabled={loading} onClick={() => void load()}><RefreshCw size={14}/>Refresh</button></div>
        </div>
        {loading ? <div className="support-empty">Loading notifications…</div> : !user ? (
          <div className="support-empty"><Bell size={26}/><h2>Sign in to see your notifications</h2><p>Updates are private and tied to your Discord account.</p><Link href="/api/auth/discord/login" className="hire-primary">Sign in with Discord</Link></div>
        ) : items.length===0 ? (
          <div className="support-empty"><Bell size={26}/><h2>You’re all caught up</h2><p>When a ticket, application, or moderation decision changes, it will appear here.</p></div>
        ) : (
          <div className="notifications-list">
            {items.map(item => (
              <article className={"notification-row"+(item.readAt?" is-read":" is-unread")} key={item._id}>
                <span className="notification-icon"><Bell size={17}/></span>
                <div className="notification-copy"><div className="notification-heading"><h2>{item.title}</h2>{!item.readAt&&<span className="notification-new-dot" aria-label="Unread"/>}</div><p>{item.body}</p><div className="notification-meta"><span>{item.category}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div></div>
                <div className="notification-actions"><button type="button" className="hire-primary" disabled={busy===item._id} onClick={() => void openNotification(item)}>{item.href?"Open":"View"} <ExternalLink size={13}/></button>{!item.readAt&&<button type="button" className="hire-secondary" disabled={busy===item._id} onClick={() => void markRead(item._id)}>Mark read</button>}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
