"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpRight, Bot, Check, ChevronDown, CircleHelp,
  Code2, Crown, FileCode2, History, Layers3, LogIn, MessageSquarePlus,
  MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, Settings2, ShieldCheck, Copy, Download,
  Sparkles, WandSparkles, Menu, X
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


function CodeArtifact({ language, filename, code }: { language: string; filename: string; code: string }) {
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Clipboard access was blocked by the browser. Select the code and copy it manually.");
    }
  }
  function downloadCode() {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.split("/").pop() || "Script.lua";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
  return <section className="spai-code-file">
    <div className="spai-code-file-head">
      <span className="spai-code-filename"><FileCode2 size={14}/><strong>{filename}</strong></span>
      <span className="spai-code-language">{language.toUpperCase()}</span>
      <div className="spai-code-actions">
        <button type="button" onClick={copyCode} title="Copy source"><Copy size={13}/>{copied ? "Copied" : "Copy"}</button>
        <button type="button" onClick={downloadCode} title="Download source file"><Download size={13}/>Download</button>
      </div>
    </div>
    <pre><code>{code.replace(/\n$/, "")}</code></pre>
  </section>;
}

function renderAssistantContent(content: string): ReactNode {
  const fence = new RegExp("\\x60\\x60\\x60([^\\n]*)\\n([\\s\\S]*?)\\x60\\x60\\x60", "g");
  const blocks: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(content)) !== null) {
    const plain = content.slice(cursor, match.index).trim();
    if (plain) blocks.push(<p className="spai-response-text" key={"text-" + index}>{plain}</p>);
    const info = match[1].trim();
    const language = info.split(/\\s+/)[0] || "lua";
    const explicitFilename = info.match(/(?:filename|file|path)=["']?([^"'\\s\\x60]+)["']?/i)?.[1];
    const trailingInfo = info.slice(language.length).trim().replace(/^(?:filename|file|path)=["']?/, "").replace(/["']$/, "");
    const filename = explicitFilename || (trailingInfo.includes("/") || /\\.(?:lua|luau)$/i.test(trailingInfo) ? trailingInfo : "Script-" + (index + 1) + ".lua");
    blocks.push(<CodeArtifact key={"code-" + index} language={language} filename={filename} code={match[2]}/>);
    cursor = match.index + match[0].length;
    index += 1;
  }
  const trailing = content.slice(cursor).trim();
  if (trailing) blocks.push(<p className="spai-response-text" key="text-tail">{trailing}</p>);
  return blocks.length ? <div className="spai-response-content">{blocks}</div> : <p className="spai-response-text">{content}</p>;
}

export default function SpiderAIPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [project, setProject] = useState("Untitled project");
  const [editingProject, setEditingProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [model, setModel] = useState("Default");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (data) => {
        if (!active) return;
        const signedInUser = data.user ?? null;
        setUser(signedInUser);
        if (signedInUser) {
          try {
            const statusResponse = await fetch("/api/ai/chat", { cache: "no-store" });
            const status = await statusResponse.json();
            if (active) setAiReady(Boolean(status.ready));
          } catch {
            if (active) setAiReady(false);
          }
        }
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();
    if (!text || isGenerating || !user) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setPrompt("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map((message) => ({ role: message.role, content: message.text })), detail: model }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Spider Uncopylocked AI could not complete the request.");
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((current) => [...current, { role: "assistant", text: "I couldn't generate a response. " + message }]);
    } finally {
      setIsGenerating(false);
    }
  }

  function startPrompt(text: string) {
    setPrompt(text);
    window.requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(".spai-composer-welcome textarea")?.focus());
  }

  const avatarUrl = user?.avatar || "";

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileSidebarOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [mobileSidebarOpen]);

  return (
    <main className="spai-root">
      {mobileSidebarOpen && <button type="button" className="spai-backdrop" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation menu" />}
      <aside className={"spai-sidebar" + (!sidebarOpen ? " is-collapsed" : "") + (mobileSidebarOpen ? " is-mobile-open" : "")}>
        <div className="spai-sidebar-brand-row"><Link href="/" className="spai-brand" aria-label="Spider Uncopylocked home"><img className="spai-brand-image" src="/spider-uncopylocked-pfp.webp" alt="" /><span>SPIDER<small>UNCOPYLOCKED</small></span></Link><button type="button" className="spai-mobile-close" aria-label="Close navigation menu" onClick={() => setMobileSidebarOpen(false)}><X size={18}/></button></div>
        <button className="spai-new-project" onClick={() => { setMessages([]); setProject("Untitled project"); setPrompt(""); }}>
          <Plus size={16} /> New project <span className="spai-shortcut">⌘ K</span>
        </button>
        <div className="spai-sidebar-heading">WORKSPACE</div>
        <button className="spai-side-link active"><Layers3 size={16} /> Spider Uncopylocked AI</button>
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
          <p>Access creator perks and member resources from Spider Uncopylocked.</p>
          <Link href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer">View VIP pass <ArrowUpRight size={14}/></Link>
        </div>
        <div className="spai-sidebar-bottom">
          <Link href="/"><ArrowDown size={15} className="spai-back-icon"/> Back to website</Link>
          <Link className="spai-side-link" href="/settings"><Settings2 size={16}/> Settings</Link>
          {authLoading ? <div className="spai-user-row"><span className="spai-avatar spai-avatar-loading" /><span><strong>Checking Discord…</strong><small>Loading account</small></span></div> :
            user ? <div className="spai-user-row">
              {avatarUrl ? <img className="spai-user-avatar" src={avatarUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="spai-avatar">{String(user.displayName || user.username || "?").slice(0, 1).toUpperCase()}</span>}
              <span><strong>{user.displayName || user.username}</strong><small>@{user.username} · Discord</small></span>
              <Link href="/api/auth/logout" aria-label="Sign out" title="Sign out"><MoreHorizontal size={17}/></Link>
            </div> :
            <div className="spai-signin-card">
              <p>Sign in to connect your account</p>
              <Link href="/api/auth/discord/login"><LogIn size={14}/> Continue with Discord</Link>
            </div>}
        </div>
      </aside>

      <section className="spai-main">
        <header className="spai-topbar">
          <div className="spai-top-left">
            <button className="spai-icon-button spai-sidebar-toggle" aria-label={mobileSidebarOpen ? "Close navigation menu" : sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} onClick={() => { if (window.matchMedia("(max-width: 620px)").matches) setMobileSidebarOpen((open) => !open); else setSidebarOpen((open) => !open); }}><Menu className="spai-mobile-menu-icon" size={17}/>{sidebarOpen ? <PanelLeftClose className="spai-desktop-toggle-icon" size={17}/> : <PanelLeftOpen className="spai-desktop-toggle-icon" size={17}/>}</button>
            <span className="spai-top-divider"/>
            {editingProject ? <input autoFocus value={project} onChange={(e) => setProject(e.target.value)} onBlur={() => setEditingProject(false)} onKeyDown={(e) => e.key === "Enter" && setEditingProject(false)} className="spai-project-input"/> : <button className="spai-project-name" onClick={() => setEditingProject(true)}>{project}<ChevronDown size={14}/></button>}
            <span className="spai-unsaved"><span/> Draft</span>
          </div>
          <div className="spai-top-right">
            <span className="spai-connection"><span/>{user ? (aiReady === false ? "AI setup required" : aiReady ? "AI ready" : "Discord connected") : "Sign in required"}</span>
            {!user && <Link className="spai-upgrade" href="/api/auth/discord/login"><LogIn size={14}/> Sign in <ArrowUpRight size={14}/></Link>}
            {user && <Link className="spai-upgrade" href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer"><Sparkles size={14}/> Get VIP <ArrowUpRight size={14}/></Link>}
          </div>
        </header>

        <div className="spai-content">
          {messages.length === 0 ? <div className="spai-welcome">
            <div className="spai-kicker"><span className="spai-kicker-dot"/> SPIDER UNCOPYLOCKED AI <span className="spai-kicker-line"/></div>
            <h1>What are we<br/><span>building today?</span></h1>
            <p className="spai-subtitle">Describe the Roblox system you want to build. Start with a detailed template or write your own instructions.</p>
            {user ? <form className="spai-composer spai-composer-welcome" onSubmit={sendMessage}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Describe what you want to build in Roblox Studio…" rows={3} aria-label="Describe what you want to build"/>
              <div className="spai-composer-tools">
                <div className="spai-composer-left">
                  <span className="spai-input-note"><Code2 size={14}/> Generates source files you can download</span>
                  <div className="spai-model-wrap">
                    <button type="button" className="spai-model-select" onClick={() => setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>
                    {showModelMenu && <div className="spai-model-menu">{["Default", "Fast", "Detailed"].map((m) => <button type="button" key={m} onClick={() => {setModel(m);setShowModelMenu(false)}}>{m}{model===m&&<Check size={13}/>}</button>)}</div>}
                  </div>
                </div>
                <button type="submit" className="spai-send-button" disabled={!prompt.trim() || isGenerating}>{isGenerating ? "Building…" : "Generate"} <WandSparkles size={15}/></button>
              </div>
            </form> : <div className="spai-auth-gate"><div className="spai-auth-glyph"><LogIn size={22}/></div><h3>Sign in to start building</h3><p>Connect your Discord account to use the Spider Uncopylocked workspace and show your profile here.</p><Link href="/api/auth/discord/login"><LogIn size={15}/> Continue with Discord</Link></div>}
            {user && <><div className="spai-suggestions-label"><span>START WITH A BUILD TEMPLATE</span><span className="spai-suggestions-rule"/></div>
            <div className="spai-starter-grid">{starterPrompts.map((item) => <button type="button" key={item.title} className="spai-starter" onClick={() => startPrompt(item.prompt)}><span className="spai-starter-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={14} className="spai-starter-arrow"/></button>)}</div>
            <div className="spai-build-note"><ShieldCheck size={14}/> Each generated file includes its Explorer path, copy controls and a direct download.</div>{aiReady === false && <div className="spai-provider-warning"><strong>AI provider setup needed</strong><span>Add AI_GATEWAY_API_KEY to use Vercel AI Gateway, or configure AI_API_KEY and AI_MODEL in this project’s Vercel environment variables.</span></div>}</>}
          </div> : <div className="spai-chat-layout">
            <div className="spai-chat-header"><div><span className="spai-chat-label">SPIDER UNCOPYLOCKED AI</span><h2>{messages.find(m=>m.role==="user")?.text || "New conversation"}</h2></div><button className="spai-icon-button" onClick={() => setMessages([])} title="New chat"><MessageSquarePlus size={17}/></button></div>
            <div className="spai-messages">{messages.map((message, index) => <div className={"spai-message "+message.role} key={index}><div className="spai-message-avatar">{message.role==="assistant"?<img className="spai-message-user-avatar" src="/spider-uncopylocked-pfp.webp" alt="Spider Uncopylocked"/>: user && avatarUrl ? <img className="spai-message-user-avatar" src={avatarUrl} alt=""/> : "?"}</div><div className="spai-message-body"><div className="spai-message-name">{message.role==="assistant"?"Spider Uncopylocked":(user?.displayName || user?.username || "You")}<span>{message.role==="assistant"?"WORKSPACE NOTICE":"JUST NOW"}</span></div>{message.role === "assistant" ? renderAssistantContent(message.text) : <p className="spai-response-text">{message.text}</p>}{message.role === "assistant" && message.text.includes("```") && <div className="spai-preview-box spai-code-note"><div><FileCode2 size={16}/><span><strong>Source files generated</strong><small>Download a file and place it at the Explorer path shown above.</small></span></div><span className="spai-status-pill">READY TO USE</span></div>}</div></div>)}</div>
            <form className="spai-composer spai-composer-chat" onSubmit={sendMessage}><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Describe the full system you want to build…" rows={2} aria-label="Message Spider Uncopylocked"/><div className="spai-composer-tools"><div className="spai-composer-left"><span className="spai-input-note"><Code2 size={14}/> Code files</span><button type="button" className="spai-model-select" onClick={()=>setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>{showModelMenu&&<span className="spai-model-inline">Model choice preview</span>}</div><button type="submit" className="spai-send-button" disabled={!prompt.trim() || isGenerating}><ArrowUp size={16}/></button></div></form>
            <div className="spai-chat-foot"><ShieldCheck size={13}/> Generated scripts stay in this browser workspace. Download them and add them to Roblox Studio using the paths provided.</div>
          </div>}
        </div>
        <footer className="spai-footer"><span>SPIDER UNCOPYLOCKED AI <span className="spai-footer-version">WORKSPACE</span></span><span><CircleHelp size={13}/> Built for Roblox creators <span className="spai-footer-sep">·</span> Scripts, modules and UI code</span></footer>
      </section>
    </main>
  );
}
