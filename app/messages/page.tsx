"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import {
  ArrowUpRight,
  Check,
  X,
  Ban,
  Flag,
  Pencil,
  Trash2,
  LoaderCircle,
  LogIn,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Account = { id: string; username?: string; displayName?: string; avatar?: string };
type Conversation = {
  id: string;
  otherDiscordId: string;
  otherName: string;
  otherAvatar?: string;
  contextTitle?: string;
  lastMessageText?: string;
  updatedAt: number;
  requestStatus?: "pending" | "accepted" | "declined";
  isIncomingRequest?: boolean;
};
type Message = {
  id: string;
  senderDiscordId: string;
  body: string;
  createdAt: number;
  readBy: string[];
  editedAt?: number;
  deletedAt?: number;
};

export default function MessagesPage() {
  const [user, setUser] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const startedFor = useRef("");

  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const url = selectedId ? "/api/messages?conversationId=" + encodeURIComponent(selectedId) : "/api/messages";
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Messages are temporarily unavailable.");
        return;
      }
      setError("");
      setConversations(data.conversations || []);
      if (selectedId) {
        setMessages(data.messages || []);
        void fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read", conversationId: selectedId }),
        });
      } else {
        setMessages([]);
      }
    } catch {
      setError("Could not connect to the messaging service. Please try again.");
    }
  }, [user, selectedId]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then(response => response.json())
      .then(data => { if (active) setUser(data.user || null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAccountLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void loadMessages().finally(() => setLoading(false));
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadMessages(); }, 15000);
    return () => window.clearInterval(timer);
  }, [user, loadMessages, refreshToken]);

  useEffect(() => {
    if (!user || startedFor.current) return;
    const params = new URLSearchParams(window.location.search);
    const recipientDiscordId = params.get("recipient");
    if (!recipientDiscordId) return;
    startedFor.current = recipientDiscordId;
    const contextType = params.get("contextType") || "developer";
    const contextTitle = params.get("contextTitle") || "";
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", recipientDiscordId, contextType, contextTitle }),
    })
      .then(response => response.json().then(data => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) { setError(data.error || "Could not start this conversation."); return; }
        setSelectedId(data.conversationId);
        setRefreshToken(value => value + 1);
        window.history.replaceState({}, "", "/messages");
      })
      .catch(() => setError("Could not start this conversation. Please try again."));
  }, [user]);

  async function messageAction(action: string, extra: Record<string, string>) {\n    if (!selectedId) return;\n    setError("");\n    try {\n      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, conversationId: selectedId, ...extra }) });\n      const data = await response.json();\n      if (!response.ok) { setError(data.error || "That action could not be completed."); return; }\n      if (action === "decline" || action === "block") setSelectedId("");\n      setRefreshToken(value => value + 1);\n    } catch { setError("Could not connect to messaging. Please try again."); }\n  }\n\n  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", conversationId: selectedId, body }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Message could not be sent."); return; }
      setDraft("");
      setRefreshToken(value => value + 1);
    } catch {
      setError("Could not send the message. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const filtered = conversations.filter(conversation =>
    [conversation.otherName, conversation.contextTitle || "", conversation.lastMessageText || ""]
      .join(" ").toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = conversations.find(conversation => conversation.id === selectedId);

  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content messages-page">
        <header className="hire-page-head messages-page-heading">
          <div><span className="spider-eyebrow">SPIDER / WORKSPACE</span><h1>Messages</h1><p>Private conversations with creators, saved in your Spider account.</p></div>
          {!user && !accountLoading && <Link href="/api/auth/discord/login" className="hire-primary"><LogIn size={15} /> Sign in with Discord</Link>}
        </header>

        {!user && !accountLoading ? (
          <section className="messages-signin-card">
            <span className="messages-empty-icon"><ShieldCheck size={25} /></span>
            <h2>Sign in to open your inbox</h2>
            <p>Private messages are tied to your signed-in Discord account. We never show conversations to other users.</p>
            <Link href="/api/auth/discord/login" className="hire-primary"><LogIn size={15} /> Sign in with Discord</Link>
          </section>
        ) : (
          <div className="messages-workspace">
            <section className="messages-list-panel" aria-label="Conversation list">
              <div className="messages-list-heading">
                <div className="messages-list-title"><h2>Inbox</h2><span>{conversations.length}</span></div>
                <label className="messages-search-box"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search conversations" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" /></label>
              </div>
              <div className="messages-conversation-list">
                {accountLoading || loading && conversations.length === 0 ? (
                  <div className="messages-loading"><LoaderCircle size={20} /> Loading your inbox…</div>
                ) : filtered.length ? filtered.map(conversation => (
                  <button key={conversation.id} type="button" className={"messages-conversation" + (selectedId === conversation.id ? " selected" : "")} onClick={() => setSelectedId(conversation.id)}>
                    <span className="messages-conversation-avatar">{conversation.otherAvatar ? <img src={conversation.otherAvatar} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : <UserRound size={18} />}</span>
                    <span className="messages-conversation-copy"><strong>{conversation.otherName}</strong>{conversation.contextTitle && <small>{conversation.contextTitle}</small>}<span>{conversation.requestStatus === "pending" ? (conversation.isIncomingRequest ? "New message request" : "Request sent · awaiting acceptance") : conversation.lastMessageText || "Conversation started — say hello."}</span></span>
                    <time>{new Date(conversation.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                  </button>
                )) : (
                  <div className="messages-list-empty"><MessagesSquare size={25} /><h3>{search ? "No matching conversations" : "Your inbox is ready"}</h3><p>{search ? "Try another name or keyword." : "Open a developer profile and choose Message to start a private conversation."}</p><Link href="/developers" className="hire-primary">Browse developers <ArrowUpRight size={14} /></Link></div>
                )}
              </div>
            </section>

            <section className="messages-thread-panel" aria-label="Selected conversation">
              {selected ? (
                <>
                  <header className="messages-thread-heading">
                    <span className="messages-conversation-avatar">{selected.otherAvatar ? <img src={selected.otherAvatar} alt="" /> : <UserRound size={18} />}</span>
                    <div><h2>{selected.otherName}</h2><p>{selected.contextTitle || "Private conversation"}</p></div>
                    <span className="messages-private-chip"><ShieldCheck size={13} /> Private</span>\n                    <button type="button" className="messages-tool-button" onClick={() => { if (window.confirm("Block this member from messaging you?")) void messageAction("block", { targetDiscordId: selected.otherDiscordId }); }} title="Block member" aria-label="Block member"><Ban size={15} /></button>
                  </header>
                  {selected.requestStatus === "pending" && selected.isIncomingRequest && <div className="messages-request-banner"><div><strong>Message request</strong><p>Accept to continue this conversation, or decline if you don’t want to hear from this member.</p></div><div className="messages-request-actions"><button type="button" onClick={() => void messageAction("accept", {})}><Check size={14} /> Accept</button><button type="button" onClick={() => void messageAction("decline", {})}><X size={14} /> Decline</button></div></div>}\n                  {selected.requestStatus === "pending" && !selected.isIncomingRequest && <div className="messages-request-banner"><div><strong>Request sent</strong><p>You can send one introductory message while waiting. They must accept before replying.</p></div></div>}\n                  <div className="messages-thread-body">
                    {messages.length ? messages.map(message => {
                      const mine = message.senderDiscordId === user?.id;
                      return <div key={message.id} className={"messages-bubble-row" + (mine ? " mine" : "")}><article className="messages-bubble"><p>{message.body}</p><time>{new Date(message.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{message.editedAt ? " · edited" : ""}{mine && message.readBy.length > 1 ? <Check size={12} /> : null}</time><div className="messages-bubble-actions">{mine && !message.deletedAt && <><button type="button" aria-label="Edit message" title="Edit message" onClick={() => { const next = window.prompt("Edit your message", message.body); if (next?.trim()) void fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "edit", messageId: message.id, body: next }) }).then(async response => { const data = await response.json(); if (!response.ok) setError(data.error || "Could not edit message."); else setRefreshToken(value => value + 1); }); }}><Pencil size={12} /></button><button type="button" aria-label="Delete message" title="Delete message" onClick={() => { if (window.confirm("Delete this message? Moderation history will be retained.")) void fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", messageId: message.id }) }).then(async response => { const data = await response.json(); if (!response.ok) setError(data.error || "Could not delete message."); else setRefreshToken(value => value + 1); }); }}><Trash2 size={12} /></button></>}{!mine && !message.deletedAt && <button type="button" aria-label="Report message" title="Report message" onClick={() => { const reason = window.prompt("Why are you reporting this message?"); if (reason?.trim()) void fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", messageId: message.id, reason }) }).then(async response => { const data = await response.json(); if (!response.ok) setError(data.error || "Could not report message."); else setError("Message reported to the moderation team."); }); }}><Flag size={12} /></button>}</div></article></div>;
                    }) : <div className="messages-thread-empty"><MessagesSquare size={24} /><h3>Start the conversation</h3><p>Introduce yourself and share what you'd like to build together.</p></div>}
                  </div>
                  {!(selected.requestStatus === "pending" && selected.isIncomingRequest) && selected.requestStatus !== "declined" ? <form className="messages-compose" onSubmit={sendMessage}>
                    <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a message…" aria-label="Message text" />
                    <div><small>{draft.length}/2,000 · Keep project details and payment terms clear.</small><button type="submit" className="hire-primary" disabled={!draft.trim() || sending}>{sending ? <LoaderCircle size={15} /> : <Send size={15} />} Send</button></div>
                  </form>
                </>
              ) : (
                <div className="messages-thread-empty"><span className="messages-empty-icon"><MessagesSquare size={27} /></span><h2>Select a conversation</h2><p>Choose someone from your inbox or open a developer profile to start a new conversation. Messages are stored privately and checked against account membership.</p><Link href="/developers" className="hire-primary">Browse developers <ArrowUpRight size={14} /></Link></div>
              )}
            </section>
          </div>
        )}
        {error && <p className="messages-error" role="alert">{error}</p>}
        <p className="messages-safety-note"><ShieldCheck size={14} /> Never share passwords, authentication codes, or private payment information in chat.</p>
      </section>
    </main>
  );
}
