"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowRight, Clock3, LifeBuoy, Plus, RefreshCw } from "lucide-react";

type Ticket={ticketNumber:number;category:string;subject:string;status:string;priority:string;updatedAt:number;createdAt:number};
export default function MyTicketsPage(){
 const [tickets,setTickets]=useState<Ticket[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/tickets",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load tickets.");setTickets(d.tickets||[])}catch(e){setError(e instanceof Error?e.message:"Ticket list is unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 return <main className="market-shell support-center-page"><SpiderSidebar/><section className="market-content support-center-content">
  <header className="support-hero-panel compact"><span className="spider-eyebrow">SPIDER / YOUR ACCOUNT</span><h1>My tickets</h1><p>Track every support request, see the latest status, and reply to staff.</p><div className="support-hero-actions"><Link href="/support" className="hire-primary"><Plus size={15}/> New ticket</Link><button type="button" className="hire-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></header>
  <section className="support-tickets-panel"><div className="support-section-heading"><div><h2>Your support history</h2><p>{tickets.length} saved {tickets.length===1?"ticket":"tickets"}</p></div></div>
  {loading?<p className="support-empty">Loading your ticket history…</p>:error?<div className="support-feedback" role="alert">{error} <button onClick={()=>void load()}>Try again</button></div>:tickets.length===0?<div className="support-empty"><LifeBuoy size={28}/><h3>No tickets yet</h3><p>When you submit a request, its number and status will appear here.</p><Link className="hire-primary" href="/support">Open your first ticket <ArrowRight size={15}/></Link></div>:<div className="support-ticket-list">{tickets.map(t=><Link className="support-ticket-row" href={"/tickets/"+t.ticketNumber} key={t.ticketNumber}><span className="support-ticket-number">#{t.ticketNumber}</span><span className="support-ticket-summary"><strong>{t.subject}</strong><small>{t.category} · Updated {new Date(t.updatedAt).toLocaleString()}</small></span><span className={"support-status-chip status-"+t.status.toLowerCase().replaceAll(" ","-")}>{t.status}</span><ArrowRight size={16}/></Link>)}</div>}</section>
 </section></main>
}
