"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { MessagesSquare, LogIn, ShieldCheck, Users, Search } from "lucide-react";

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) setUser(data.user || null); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content messages-page">
        <header className="hire-page-head">
          <div>
            <span className="spider-eyebrow">SPIDER / WORKSPACE</span>
            <h1>Messages</h1>
            <p>Your conversations and collaboration requests in one place.</p>
          </div>
          {!user && (
            <Link href="/api/auth/discord/login" className="hire-primary">
              <LogIn size={15} /> Sign in with Discord
            </Link>
          )}
        </header>

        <div className="messages-workspace">
          <section className="messages-list-panel" aria-label="Conversation list">
            <div className="messages-list-heading">
              <h2>Inbox</h2>
              <label className="messages-search-box">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search conversations"
                  disabled
                  placeholder="Search conversations"
                  title="Conversation search will be available when messaging is enabled."
                />
              </label>
            </div>
            <div className="messages-list-empty">
              <MessagesSquare size={24} strokeWidth={1.6} aria-hidden="true" />
              <h3>No conversations yet</h3>
              <p>
                {user
                  ? "Your account is connected. Conversations will appear here when Spider messaging is enabled."
                  : "Sign in to identify your account, then find a creator to work with."}
              </p>
              {!user && (
                <Link href="/api/auth/discord/login" className="hire-primary">
                  <LogIn size={14} /> Sign in
                </Link>
              )}
            </div>
          </section>

          <section className="messages-thread-panel" aria-label="Selected conversation">
            <div>
              <MessagesSquare size={27} strokeWidth={1.5} aria-hidden="true" />
              <h2>Select a conversation</h2>
              <p>
                A selected conversation will appear here. The private messaging backend is not active yet, so this page does not create or simulate messages.
              </p>
              <Link href="/developers" className="hire-primary">
                <Users size={14} /> Browse developers
              </Link>
            </div>
          </section>
        </div>

        <div className="message-privacy">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            Keep project details and payment terms clear when working with someone new. Spider currently does not send or store private messages from this page.
          </span>
        </div>
      </section>
    </main>
  );
}
