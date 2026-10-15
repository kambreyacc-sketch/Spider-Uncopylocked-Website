"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowRight, ClipboardList, Plus, RefreshCw } from "lucide-react";
type App={applicationNumber:number;type:string;subject:string;status:string;createdAt:number;updatedAt:number;decisionReason?:string};
export default function ApplicationsPage(){
 const [rows,setRows]=useState<App[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/applications",{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load applications.");setRows(d.applications||[])}catch(e){setError(e instanceof Error?e.message:"Application history is unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 return <main className="market-shell application-workspace"><SpiderSidebar/><section className="market-content application-content"><header className="support-hero-panel compact"><span className="spider-eyebrow">SPIDER / YOUR ACCOUNT</span><h1>My applications</h1><p>Review your saved drafts, submitted requests, and the reasons for decisions.</p><div className="support-hero-actions"><Link href="/apply" className="hire-primary"><Plus size={15}/> New application</Link><button className="hire-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></header>
 <section className="support-tickets-panel"><div className="support-section-heading"><div><h2>Application history</h2><p>{rows.length} saved requests</p></div></div>
 {loading?<p className="support-empty">Loading application history…</p>:error?<div className="support-feedback" role="alert">{error} <button onClick={()=>void load()}>Retry</button></div>:rows.length===0?<div className="support-empty"><ClipboardList size={28}/><h3>No applications yet</h3><p>Your applications and decisions will appear here.</p><Link className="hire-primary" href="/apply">Start an application <ArrowRight size={15}/></Link></div>:<div className="support-ticket-list">{rows.map(a=><Link className="support-ticket-row" href={"/applications/"+a.applicationNumber} key={a.applicationNumber}><span className="support-ticket-number">#{a.applicationNumber}</span><span className="support-ticket-summary"><strong>{a.subject}</strong><small>{a.type} · Updated {new Date(a.updatedAt).toLocaleString()}</small></span><span className={"support-status-chip status-"+a.status.toLowerCase().replaceAll(" ","-")}>{a.status}</span><ArrowRight size={16}/></Link>)}</div>}
 </section></section></main>
}
