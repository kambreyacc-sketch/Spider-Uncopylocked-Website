"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowRight, FileWarning, RefreshCw } from "lucide-react";

type Report={reference:string;reportedType:string;targetUrl:string;reason:string;details:string;status:string;createdAt:number;updatedAt:number};
const statusLabels:Record<string,string>={submitted:"Submitted",pending:"Pending review",under_investigation:"Under investigation",additional_information_requested:"More information requested",action_taken:"Action taken",dismissed:"Dismissed",closed:"Closed"};
export default function MyReportsPage(){
 const [reports,setReports]=useState<Report[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/reports",{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load your reports.");setReports(d.reports||[])}catch(e){setError(e instanceof Error?e.message:"Report history unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 return <main className="market-shell support-center-page"><SpiderSidebar/><section className="market-content support-center-content">
  <header className="support-hero-panel compact"><span className="spider-eyebrow">SPIDER / TRUST & SAFETY</span><h1>My reports</h1><p>Track the reports you’ve submitted. Private reviewer notes and other members’ information are never shown here.</p><div className="support-hero-actions"><Link href="/report-scam" className="hire-primary"><FileWarning size={15}/> Report an issue</Link><button className="hire-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></header>
  <section className="support-tickets-panel"><div className="support-section-heading"><div><h2>Report history</h2><p>{reports.length} submitted {reports.length===1?"report":"reports"}</p></div></div>
  {loading?<p className="support-empty">Loading your reports…</p>:error?<div className="support-feedback" role="alert">{error}<button onClick={()=>void load()}>Try again</button></div>:reports.length===0?<div className="support-empty"><FileWarning size={28}/><h3>No reports submitted</h3><p>If you need to report a scam, suspicious listing, or creator, submit a report with a link and clear explanation.</p><Link href="/report-scam" className="hire-primary">Create a report <ArrowRight size={15}/></Link></div>:<div className="support-ticket-list">{reports.map(r=><article className="support-ticket-row report-history-row" key={r.reference}><span className="support-ticket-number">{r.reference}</span><span className="support-ticket-summary"><strong>{r.reason}</strong><small>{r.reportedType} · Submitted {new Date(r.createdAt).toLocaleString()}</small><small><a href={r.targetUrl} target="_blank" rel="noreferrer">{r.targetUrl}</a></small></span><span className="support-status-chip">{statusLabels[r.status]||r.status}</span></article>)}</div>}
  </section>
 </section></main>
}
