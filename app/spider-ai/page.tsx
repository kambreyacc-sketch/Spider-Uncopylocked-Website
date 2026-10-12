"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpRight, Bot, Check, ChevronDown, CircleHelp,
  Code2, Crown, FileCode2, History, Layers3, MessageSquarePlus, MoreHorizontal,
  PanelLeftClose, Paperclip, Plus, Settings2, ShieldCheck, Sparkles, WandSparkles
} from "lucide-react";
import "./spider-ai.css";

type ChatMessage = { role: "user" | "assistant"; text: string };

const starterPrompts = [
  { icon: "⚔", title: "Combat system", detail: "Create a responsive melee combat system" },
  { icon: "◈", title: "Shop UI", detail: "Build a polished in-game shop interface" },
  { icon: "⌁", title: "Claimable plots", detail: "Make plots players can claim and upgrade" },
  { icon: "◷", title: "Round system", detail: "Add timed rounds with a lobby phase" },
];

export default function SpiderAIPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [project, setProject] = useState("Untitled project");
  const [editingProject, setEditingProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState("Spider AI");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function sendMessage(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? prompt).trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "assistant", text: "I’ve got your request. The Spider AI workspace UI is being set up; live AI generation and Roblox Studio syncing will be connected in the next build phase. Your prompt is saved in this conversation preview, but no game files have been changed." },
    ]);
    setPrompt("");
  }

  return (
    <main className="spai-root">
      {sidebarOpen && <aside className="spai-sidebar">
        <Link href="/" className="spai-brand" aria-label="Spider Uncopylocked home">
          <span className="spai-brand-mark"><span /></span>
          <span>SPIDER<small>UNCOPYLOCKED</small></span>
        </Link>
        <button className="spai-new-project" onClick={() => { setMessages([]); setProject("Untitled project"); }}>
          <Plus size={16} /> New project <span className="spai-shortcut">⌘ K</span>
        </button>
        <div className="spai-sidebar-heading">WORKSPACE</div>
        <button className="spai-side-link active"><Layers3 size={16} /> AI workspace</button>
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
          <div><strong>Spider VIP</strong><small>Premium access</small></div>
          <span className="spai-vip-status">LOCKED</span>
          <p>Unlock the AI tools and plugin downloads with verified VIP access.</p>
          <Link href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer">View VIP pass <ArrowUpRight size={14}/></Link>
        </div>
        <div className="spai-sidebar-bottom">
          <Link href="/"><ArrowDown size={15} className="spai-back-icon"/> Back to website</Link>
          <button className="spai-side-link"><Settings2 size={16}/> Settings <span className="spai-soon">SOON</span></button>
          <div className="spai-user-row"><span className="spai-avatar">S</span><span><strong>Spider Creator</strong><small>Spider Uncopylocked</small></span><MoreHorizontal size={17}/></div>
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
            <span className="spai-connection"><span/> Workspace preview</span>
            <Link className="spai-upgrade" href="https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" target="_blank" rel="noreferrer"><Sparkles size={14}/> Get VIP <ArrowUpRight size={14}/></Link>
          </div>
        </header>

        <div className="spai-content">
          {messages.length === 0 ? <div className="spai-welcome">
            <div className="spai-kicker"><span className="spai-kicker-dot"/> YOUR ROBLOX BUILD PARTNER <span className="spai-kicker-line"/></div>
            <h1>What are we<br/><span>building today?</span></h1>
            <p className="spai-subtitle">Describe a mechanic, a system, or your next big idea.<br/>Spider AI is being built to help bring it to life in Roblox Studio.</p>
            <form className="spai-composer spai-composer-welcome" onSubmit={sendMessage}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Describe the game mechanic you want to create..." rows={3} aria-label="Describe a game mechanic"/>
              <div className="spai-composer-tools">
                <div className="spai-composer-left">
                  <button type="button" className="spai-tool-button" title="Attach files (coming soon)" onClick={() => alert("File attachments will be added in a later build.")}><Paperclip size={15}/><span>Attach</span></button>
                  <div className="spai-model-wrap">
                    <button type="button" className="spai-model-select" onClick={() => setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>
                    {showModelMenu && <div className="spai-model-menu">{["Spider AI", "Fast mode", "Deep reasoning"].map((m) => <button type="button" key={m} onClick={() => {setModel(m);setShowModelMenu(false)}}>{m}{model===m&&<Check size={13}/>}</button>)}</div>}
                  </div>
                </div>
                <button type="submit" className="spai-send-button" disabled={!prompt.trim()}>Generate <WandSparkles size={15}/></button>
              </div>
            </form>
            <div className="spai-suggestions-label"><span>NEED A STARTING POINT?</span><span className="spai-suggestions-rule"/></div>
            <div className="spai-starter-grid">{starterPrompts.map((item) => <button key={item.title} className="spai-starter" onClick={() => sendMessage(undefined, item.detail)}><span className="spai-starter-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={14} className="spai-starter-arrow"/></button>)}</div>
            <div className="spai-build-note"><ShieldCheck size={14}/> Generated changes will require review before anything is applied to your game.</div>
          </div> : <div className="spai-chat-layout">
            <div className="spai-chat-header"><div><span className="spai-chat-label">CONVERSATION</span><h2>{messages.find(m=>m.role==="user")?.text || "New conversation"}</h2></div><button className="spai-icon-button" onClick={() => setMessages([])} title="New chat"><MessageSquarePlus size={17}/></button></div>
            <div className="spai-messages">{messages.map((message, index) => <div className={"spai-message "+message.role} key={index}><div className="spai-message-avatar">{message.role==="assistant"?<span className="spai-mini-brand"><span/></span>:"S"}</div><div className="spai-message-body"><div className="spai-message-name">{message.role==="assistant"?"Spider AI":"You"}<span>{message.role==="assistant"?"PREVIEW":"JUST NOW"}</span></div><p>{message.text}</p>{message.role==="assistant"&&<div className="spai-preview-box"><div><Code2 size={16}/><span><strong>Studio connection</strong><small>Plugin integration is the next phase</small></span></div><span className="spai-status-pill">NOT CONNECTED</span></div>}</div></div>)}</div>
            <form className="spai-composer spai-composer-chat" onSubmit={sendMessage}><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Ask Spider AI to build or improve something..." rows={2} aria-label="Message Spider AI"/><div className="spai-composer-tools"><div className="spai-composer-left"><button type="button" className="spai-tool-button" onClick={()=>alert("File attachments will be added in a later build.")}><Paperclip size={15}/></button><button type="button" className="spai-model-select" onClick={()=>setShowModelMenu(!showModelMenu)}><Bot size={15}/>{model}<ChevronDown size={13}/></button>{showModelMenu&&<span className="spai-model-inline">Model selection preview only</span>}</div><button type="submit" className="spai-send-button" disabled={!prompt.trim()}><ArrowUp size={16}/></button></div></form>
            <div className="spai-chat-foot"><ShieldCheck size={13}/> Preview mode — AI generation and Studio sync are not connected yet.</div>
          </div>}
        </div>
        <footer className="spai-footer"><span>SPIDER AI <span className="spai-footer-version">EARLY PREVIEW</span></span><span><CircleHelp size={13}/> Built for Roblox creators <span className="spai-footer-sep">·</span> API connection coming next</span></footer>
      </section>
    </main>
  );
}
