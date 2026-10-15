"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SpiderSidebar from "../../components/SpiderSidebar";
import { ArrowLeft, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react";
type Entry={action:string;note?:string;createdAt:number};
type AppDetail={application:{applicationNumber:number;type:string;subject:string;answers:Record<string,unknown>;status:string;createdAt:number;updatedAt:number;decisionReason?:string};events:Entry[]};
export default function ApplicationDetailPage(){
 const params=useParams<{number:string}>(),number=String(params.number||"");
 const [data,setData]=useState<AppDetail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/applications/"+encodeURIComponent(number),{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load application.");setData(d)}catch(e){setError(e instanceof Error?e.message:"Application is unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{if(number)void load()},[number]);
 async function withdraw(){if(!window.confirm("Withdraw this application? This cannot be undone."))return;setBusy(true);setMessage("");try{const r=await fetch("/api/applications/"+encodeURIComponent(number),{method:"PATCH"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not withdraw application.");setMessage("Application withdrawn.");await load()}catch(e){setMessage(e instanceof Error?e.message:"Could not withdraw application.")}finally{setBusy(false)}}
 return <main className="market-shell application-workspace"><SpiderSidebar/><section className="market-content application-content"><Link className="support-back-link" href="/applications"><ArrowLeft size={15}/> My applications</Link>
 {loading?<p className="support-empty">Loading application…</p>:error?<div className="support-feedback" role="alert">{error}</div>:data&&<>
 <header className="support-hero-panel compact"><span className="spider-eyebrow">APPLICATION #{data.application.applicationNumber}</span><h1>{data.application.subject}</h1><p>{data.application.type} · Submitted {data.application.createdAt?new Date(data.application.createdAt).toLocaleString():"—"}</p><div className="support-hero-actions"><span className={"support-status-chip status-"+data.application.status.toLowerCase().replaceAll(" ","-")}>{data.application.status}</span><button className="hire-secondary" onClick={()=>void load()}><RefreshCw size={14}/> Refresh status</button>{["Submitted","Draft","Changes Requested"].includes(data.application.status)&&<button className="hire-secondary" disabled={busy} onClick={()=>void withdraw()}>Withdraw</button>}</div></header>
 <div className="support-layout-grid"><section className="support-form-panel"><div className="support-section-heading"><div><h2>Submitted information</h2><p>These are the answers attached to your application.</p></div></div><dl className="application-answer-list">{Object.entries(data.application.answers||{}).map(([key,value])=><div key={key}><dt>{key.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</dt><dd>{typeof value==="string"?value:JSON.stringify(value)}</dd></div>)}</dl>{message&&<p className="support-feedback" role="status">{message}</p>}{data.application.decisionReason&&<aside className="support-evidence-notice"><ShieldCheck size={17}/><span><b>Reviewer feedback</b><br/>{data.application.decisionReason}</span></aside>}</section>
 <aside className="support-info-panel"><div className="support-info-icon"><ClipboardList size={20}/></div><h2>Review history</h2>{data.events.length?<div className="support-history">{data.events.map((e,i)=><p key={i}><b>{e.action.replaceAll("_"," ")}</b><small>{e.note||""}<br/>{new Date(e.createdAt).toLocaleString()}</small></p>)}</div>:<p>No status updates yet. The team will update your history when a decision is made.</p>}</aside></div>
 </>}
 </section></main>
}
