"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpRight, Bot, Check, ChevronDown, CircleHelp,
  Code2, Crown, FileCode2, History, Layers3, LogIn, MessageSquarePlus,
  MoreHorizontal, PanelLeftClose, Paperclip, Plus, Settings2, ShieldCheck,
  Sparkles, WandSparkles
} from "lucide-react";
import "./spider-ai.css";

type ChatMessage = { role: "user" | "assistant"; text: string };
type DiscordUser = { id: string; username: string; displayName?: string; avatar?: string };

const starterPrompts = [
  {
    icon: "⚔",
    title: "Build a combat system",
    detail: "Melee combat, hit detection, cooldowns",
    prompt: "Build a complete, production-ready melee combat system for my Roblox game using Luau. First inspect the existing project structure and reuse any relevant modules instead of duplicating them. Include server-authoritative hit detection and damage, configurable attack animations, combo chains, attack cooldowns, blocking, stun and knockback, mobile and controller input support, RemoteEvents with server-side validation and rate limiting, character respawn handling, and clear configuration values. Tell me exactly which scripts and instances need to be created, where each one belongs in Explorer, and provide the full code for every script. Explain how the pieces connect and list a practical test checklist. Do not overwrite existing scripts without showing me the proposed changes first."
  },
  {
    icon: "◈",
    title: "Build a shop UI",
    detail: "Items, currency, purchases and saving",
    prompt: "Build a complete Roblox in-game shop system using Luau with a polished, responsive UI. Include categories, item cards, item previews, prices, player currency, purchase confirmation, insufficient-funds states, owned/equipped indicators, and a clear close button. Implement purchases and currency changes on the server only, validate every requested item and price on the server, prevent duplicate or spoofed purchases, and persist owned items using DataStoreService with safe error handling. Include RemoteEvents/RemoteFunctions, the full Explorer hierarchy, all LocalScripts and server Scripts, a configuration module for items and prices, and setup instructions. Review the existing project before proposing changes and show a diff before modifying anything."
  },
  {
    icon: "⌁",
    title: "Build claimable plots",
    detail: "Claiming, ownership and upgrades",
    prompt: "Create a complete claimable plot and upgrade system for my Roblox game in Luau. Players should be able to claim one available plot, see clear ownership indicators, release or retain their plot according to configurable rules, and buy upgrades using server-validated currency. Include plot assignment on join, cleanup and reassignment on leave, protection against claiming multiple plots, upgrade costs and levels, persistence where appropriate, visual feedback, UI prompts, and multiplayer-safe server authority. Explain the required Workspace folder/model structure and attributes, list every RemoteEvent and script with its exact Explorer location, provide full code for each file, and include edge-case handling and a multiplayer test checklist. Inspect existing systems first and do not replace scripts without approval."
  },
  {
    icon: "◷",
    title: "Build round-based gameplay",
    detail: "Lobby, intermission and timed rounds",
    prompt: "Build a complete round-management system for my Roblox game using Luau. Include waiting for enough players, an intermission countdown, map selection/loading, teleporting eligible players to spawn points, a configurable round timer, win/lose conditions, player elimination handling, end-of-round results, rewards, cleanup, and return to the lobby. Keep all authoritative state and rewards on the server, safely handle players joining or leaving mid-round, prevent overlapping rounds, and expose clean configuration values. Include a UI showing the current phase and countdown, sound/announcement hooks, the complete Explorer hierarchy, full code for each server/client script and module, and instructions to integrate with an existing game. Inspect first, explain the design, and show proposed changes before editing any existing scripts."
  },
];

export default function SpiderAIPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [project, setProject] = useState("Untitled project");
  const [editingProject, setEditingProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState("Default");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) setUser(data.user ?? null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "assistant", text: "Your request is ready for the Spider Uncopylocked build workflow. The live model and Roblox Studio connection are not connected yet, so I have not generated verified code or changed any game files. When the build service is connected, it should inspect your project, propose the full implementation, and ask for approval before applying edits." },
    ]);
    setPrompt("");
  }

  function startPrompt(text: string) {
    setPrompt(text);
    window.requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(".spai-composer-welcome textarea")?.focus());
  }

  const avatarUrl = user?.avatar || (user?.id ? "https://cdn.discordapp.com/embed/avatars/0.png" : "");

  return (
    <main className="spai-root">
      {sidebarOpen && <aside className="spai-sidebar">
        <Link href="/" className="spai-brand" aria-label="Spider Uncopylocked home">
          <span className="spai-brand-mark"><span /></span>
          <span>SPIDER<small>UNCOPYLOCKED</small></span>
        </Link>
        <button className="spai-new-project" onClick={() => { setMessages([]); setProject("Untitled project"); setPrompt(""); }}>
          <Plus size={16} /> New project <span className="spai-shortcut">⌘ K</span>
        </button>
        <div className="spai-sidebar-heading">WORKSPACE</div>
        <button className="spai-side-link active"><Layers3 size={16} /> AI Workspace</button>
        <button className="spai-side-link" onClick={() => setShowHistory(!showHistory)}><History size={16} /> Recent projects <span className="spai-count">{messages.length ? "1" : "0"}</span></button>
        {showHistory && <button className="spai-history-item" onClick={() => setShowHistory(false)}><FileCode2 size={14}/>{project}</button>}
        <div className="spai-project-empty">
          <div className="spai-empty-glyph"><Code2 size={20}/></div>
          <p>{messages.length ? project : "Your projects will show up here."}</p>
          <small>{messages.length ? "Conversation in progress" : "Start building something great."}</small>
        </div>
        <div className="spai-sidebar-spacer" />
        <div className="spai-vip-card">
          <div className="spai-vip-icon"><Crown size={16}/></div>
          <div><strong>VIP Access</strong><small>Spider Uncopylocked</small></div>
          <span className="spai-vip-status">VIP</span>
          <p>Verified VIP members can access the plugin download and member resources.</p>
          <Link href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer">View VIP pass <ArrowUpRight size={14}/></Link>
        </div>
        <div className="spai-sidebar-bottom">
          <Link href="/"><ArrowDown size={15} className="spai-back-icon"/> Back to website</Link>
          <Link className="spai-side-link" href="/settings"><Settings2 size={16}/> Settings</Link>
          {authLoading ? <div className="spai-user-row"><span className="spai-avatar spai-avatar-loading" /><span><strong>Checking Discord…</strong><small>Loading account</small></span></div> :
            user ? <div className="spai-user-row">
              <img className="spai-user-avatar" src={avatarUrl} alt="" />
              <span><strong>{user.displayName || user.username}</strong><small>@{user.username} · Discord</small></span>
              <Link href="/api/auth/logout" aria-label="Sign out" title="Sign out"><MoreHorizontal size={17}/></Link>
            </div> :
            <div className="spai-signin-card">
              <p>Sign in to connect your account</p>
              <Link href="/api/auth/discord/login"><LogIn size={14}/> Continue with Discord</Link>
            </div>}
        </div>
      </aside>}

      <section className="spai-main">
        <header className="spai-topbar">
          <div className="spai-top-left">
            <button className="spai-icon-button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeftClose size={17}/></button>
            <span className="spai-top-divider"/>
            {editingProject ? <input autoFocus value={project} onChange={(e) => setProject(e.target.value)} onBlur={() => setEditingProject(false)} onKeyDown={(e) => e.key === "Enter" && setEditingProject(false)} className="spai-project-input"/> : <button className="spai-project-name" onClick={() => setEditingProject(true)}>{project}<ChevronDown size={14}/></button>}
            <span className="spai-unsaved"><span/> Draft</span>
          </div>
          <div className="spai-top-right">
            <span className="spai-connection"><span/>{user ? "Discord connected" : "Sign in required"}</span>
            {!user && <Link className="spai-upgrade" href="/api/auth/discord/login"><LogIn size={14}/> Sign in <ArrowUpRight size={14}/></Link>}
            {user && <Link className="spai-upgrade" href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer"><Sparkles size={14}/> Get VIP <ArrowUpRight size={14}/></Link>}
          </div>
        </header>

        <div className="spai-content">
          {messages.length === 0 ? <div className="spai-welcome">
            <div className="spai-kicker"><span className="spai-kicker-dot"/> SPIDER UNCOPYLOCKED <span className="spai-kicker-line"/></div>
            <h1>What are we<br/><span>building today?</span></h1>
            <p className="spai-subtitle">Describe the Roblox system you want to build. Start with a detailed template or write your own instructions.</p>
            {user ? <form className="spai-composer spai-composer-welcome" onSubmit={sendMessage}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Describe what you want to build in Roblox Studio…" rows={3} aria-label="Describe what you want to build"/>
              <div className="spai-composer-tools">
                <div className="spai-composer-left">
                  <button type="button" className="spai-tool-button" title="Attachments are not available yet" onClick={() => window.alert("Attachments will be enabled when the build service is connected.")}><Paperclip size={15}/><span>Attach</span></button>
                  <div className="spai-model-wrap">
                    <button type="button" className="spai-model-select" onClick={() => setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>
                    {showModelMenu && <div className="spai-model-menu">{["Default", "Fast", "Detailed"].map((m) => <button type="button" key={m} onClick={() => {setModel(m);setShowModelMenu(false)}}>{m}{model===m&&<Check size={13}/>}</button>)}</div>}
                  </div>
                </div>
                <button type="submit" className="spai-send-button" disabled={!prompt.trim()}>Generate <WandSparkles size={15}/></button>
              </div>
            </form> : <div className="spai-auth-gate"><div className="spai-auth-glyph"><LogIn size={22}/></div><h3>Sign in to start building</h3><p>Connect your Discord account to use the Spider Uncopylocked workspace and show your profile here.</p><Link href="/api/auth/discord/login"><LogIn size={15}/> Continue with Discord</Link></div>}
            {user && <><div className="spai-suggestions-label"><span>START WITH A BUILD TEMPLATE</span><span className="spai-suggestions-rule"/></div>
            <div className="spai-starter-grid">{starterPrompts.map((item) => <button type="button" key={item.title} className="spai-starter" onClick={() => startPrompt(item.prompt)}><span className="spai-starter-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={14} className="spai-starter-arrow"/></button>)}</div>
            <div className="spai-build-note"><ShieldCheck size={14}/> Templates include full requirements. Review and edit the prompt before submitting.</div></>}
          </div> : <div className="spai-chat-layout">
            <div className="spai-chat-header"><div><span className="spai-chat-label">SPIDER UNCOPYLOCKED</span><h2>{messages.find(m=>m.role==="user")?.text || "New conversation"}</h2></div><button className="spai-icon-button" onClick={() => setMessages([])} title="New chat"><MessageSquarePlus size={17}/></button></div>
            <div className="spai-messages">{messages.map((message, index) => <div className={"spai-message "+message.role} key={index}><div className="spai-message-avatar">{message.role==="assistant"?<span className="spai-mini-brand"><span/></span>: user && avatarUrl ? <img className="spai-message-user-avatar" src={avatarUrl} alt=""/> : "?"}</div><div className="spai-message-body"><div className="spai-message-name">{message.role==="assistant"?"Spider Uncopylocked":(user?.displayName || user?.username || "You")}<span>{message.role==="assistant"?"WORKSPACE NOTICE":"JUST NOW"}</span></div><p>{message.text}</p>{message.role==="assistant"&&<div className="spai-preview-box"><div><Code2 size={16}/><span><strong>Roblox Studio connection</strong><small>Plugin connection is a separate next step</small></span></div><span className="spai-status-pill">NOT CONNECTED</span></div>}</div></div>)}</div>
            <form className="spai-composer spai-composer-chat" onSubmit={sendMessage}><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Describe the full system you want to build…" rows={2} aria-label="Message Spider Uncopylocked"/><div className="spai-composer-tools"><div className="spai-composer-left"><button type="button" className="spai-tool-button" onClick={()=>window.alert("Attachments will be enabled when the build service is connected.")}><Paperclip size={15}/></button><button type="button" className="spai-model-select" onClick={()=>setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>{showModelMenu&&<span className="spai-model-inline">Model choice preview</span>}</div><button type="submit" className="spai-send-button" disabled={!prompt.trim()}><ArrowUp size={16}/></button></div></form>
            <div className="spai-chat-foot"><ShieldCheck size={13}/> Workspace preview — live AI generation and Studio sync are not connected yet.</div>
          </div>}
        </div>
        <footer className="spai-footer"><span>SPIDER UNCOPYLOCKED <span className="spai-footer-version">WORKSPACE</span></span><span><CircleHelp size={13}/> Built for Roblox creators <span className="spai-footer-sep">·</span> Studio connection planned</span></footer>
      </section>
    </main>
  );
}
