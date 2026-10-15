"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowLeft, ArrowRight, FileCheck2, Save, ShieldCheck } from "lucide-react";

const types = [
  "Studio registration",
  "Resource / leaker upload",
  "Marketplace posting access",
  "Developer profile",
  "Content creator",
  "Discord staff role",
  "Commission / hiring access",
] as const;
type AppType = typeof types[number];
type Field = { key: string; label: string; placeholder: string; required?: boolean; multiline?: boolean; type?: string };
const fields: Record<AppType, Field[]> = {
  "Studio registration": [
    {key:"studioName",label:"Studio name",placeholder:"Your studio name",required:true},
    {key:"slug",label:"Studio handle",placeholder:"studio-handle",required:true},
    {key:"description",label:"About the studio",placeholder:"What does your team build?",required:true,multiline:true},
    {key:"specialties",label:"Specialties",placeholder:"Scripting, building, UI, VFX",required:true},
    {key:"robloxUrl",label:"Roblox group or game URL",placeholder:"https://www.roblox.com/groups/...",type:"url"},
    {key:"discordUrl",label:"Discord invite or community URL",placeholder:"https://discord.gg/...",type:"url"},
  ],
  "Resource / leaker upload": [
    {key:"assetTypes",label:"Asset types",placeholder:"Scripts, maps, models, UI kits",required:true},
    {key:"portfolioUrl",label:"Portfolio or example URL",placeholder:"https://...",type:"url"},
    {key:"source",label:"Where do your assets come from?",placeholder:"Explain ownership and the rights you have to share them.",required:true,multiline:true},
    {key:"workflow",label:"Upload and moderation plan",placeholder:"How will you ensure files are safe and properly licensed?",required:true,multiline:true},
  ],
  "Marketplace posting access": [
    {key:"listingType",label:"What do you want to list?",placeholder:"Game, UGC group, or other listing",required:true},
    {key:"robloxUrl",label:"Roblox URL",placeholder:"https://www.roblox.com/...",required:true,type:"url"},
    {key:"ownership",label:"Proof of ownership / authority",placeholder:"Explain your ownership or permission to represent this listing.",required:true,multiline:true},
  ],
  "Developer profile": [
    {key:"roles",label:"Development roles",placeholder:"Scripter, builder, UI designer",required:true},
    {key:"experience",label:"Experience",placeholder:"What have you built and what do you specialize in?",required:true,multiline:true},
    {key:"portfolio",label:"Portfolio URL",placeholder:"https://...",required:true,type:"url"},
    {key:"rate",label:"Rate or budget preference",placeholder:"Hourly, fixed project, or negotiable"},
    {key:"availability",label:"Availability",placeholder:"Available, busy, not taking commissions",required:true},
  ],
  "Content creator": [
    {key:"platforms",label:"Platforms",placeholder:"YouTube, Twitch, TikTok",required:true},
    {key:"channels",label:"Channel links",placeholder:"Links to your main channels",required:true,multiline:true},
    {key:"audience",label:"Audience / average views",placeholder:"Share approximate numbers if you know them"},
    {key:"contentPlan",label:"Content plan",placeholder:"How will you make content about Spider or Roblox development?",required:true,multiline:true},
  ],
  "Discord staff role": [
    {key:"role",label:"Role requested",placeholder:"Moderator, support, reviewer, management",required:true},
    {key:"timezone",label:"Timezone and availability",placeholder:"Your timezone and typical availability",required:true},
    {key:"experience",label:"Relevant experience",placeholder:"Moderation, support, safety, or community experience",required:true,multiline:true},
    {key:"scenario",label:"How would you handle a difficult report?",placeholder:"Explain how you would review evidence and remain fair.",required:true,multiline:true},
  ],
  "Commission / hiring access": [
    {key:"purpose",label:"What access do you need?",placeholder:"Post jobs, hire developers, manage projects",required:true},
    {key:"project",label:"Project overview",placeholder:"Describe your Roblox project and goals.",required:true,multiline:true},
    {key:"budget",label:"Expected budget / payment structure",placeholder:"Fixed budget, hourly, revenue share, or unpaid"},
    {key:"needs",label:"Roles needed",placeholder:"Scripter, builder, artist, etc."},
  ],
};
export default function ApplyPage(){
 const router=useRouter();const [type,setType]=useState<AppType>("Studio registration"),[subject,setSubject]=useState(""),[answers,setAnswers]=useState<Record<string,string>>({}),[user,setUser]=useState(false),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[draftNumber,setDraftNumber]=useState<number|undefined>();
 useEffect(()=>{fetch("/api/auth/discord/me",{cache:"no-store"}).then(r=>r.json()).then(d=>setUser(!!d.user)).catch(()=>setUser(false)).finally(()=>setChecked(true))},[]);
 function changeType(next:AppType){setType(next);setAnswers({});setSubject("");setDraftNumber(undefined);setMessage("")}
 async function save(intent:"draft"|"submit"){
  setMessage("");setBusy(true);
  try{
   const response=await fetch("/api/applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({intent,type,subject:subject||type+" request",answers,...(draftNumber?{applicationNumber:draftNumber}:{})})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save application.");
   setDraftNumber(data.applicationNumber);setMessage(intent==="draft"?"Draft saved to your account.":"Application submitted successfully. You can track it in My Applications.");
   if(intent==="submit")router.push("/applications?submitted="+data.applicationNumber);
  }catch(e){setMessage(e instanceof Error?e.message:"Could not save application.");}
  finally{setBusy(false)}
 }
 return <main className="market-shell application-workspace"><SpiderSidebar/><section className="market-content application-content">
  <Link href="/applications" className="support-back-link"><ArrowLeft size={15}/> My applications</Link>
  <header className="support-hero-panel compact"><span className="spider-eyebrow">SPIDER / APPLICATIONS</span><h1>Request access.</h1><p>One place for studio registration, creator access, profile review, and staff applications. Decisions are recorded against your signed-in account.</p></header>
  <section className="support-form-panel application-form-panel"><div className="support-section-heading"><div><span className="spider-eyebrow">NEW APPLICATION</span><h2>Tell us what you need</h2><p>Choose a request type to see its required fields.</p></div><span className="support-ticket-pill">REVIEW QUEUE</span></div>
  {!checked?<p className="support-feedback">Checking your sign-in…</p>:!user?<div className="support-signin-gate"><ShieldCheck size={24}/><h3>Sign in with Discord</h3><p>Applications must be linked to your authenticated account.</p><Link href="/api/auth/discord/login" className="hire-primary">Sign in with Discord <ArrowRight size={15}/></Link></div>:<form className="support-ticket-form" onSubmit={e=>{e.preventDefault();void save("submit")}}>
   <label>Application type<select value={type} onChange={e=>changeType(e.target.value as AppType)}>{types.map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Application title<input required minLength={4} maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)} placeholder={"e.g. "+type}/></label>
   <div className="application-dynamic-fields">{fields[type].map(f=><label key={f.key}>{f.label}{f.required&&" *"}{f.multiline?<textarea required={!!f.required} rows={4} value={answers[f.key]||""} onChange={e=>setAnswers(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}/>:<input required={!!f.required} type={f.type||"text"} value={answers[f.key]||""} onChange={e=>setAnswers(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}/>}</label>)}</div>
   <aside className="support-evidence-notice"><FileCheck2 size={17}/><span>Staff decisions are recorded in your application history. Approval only enables the specific workflow connected to that application; submitting does not automatically grant access.</span></aside>
   {message&&<p className="support-feedback" role="status">{message}</p>}
   <div className="application-form-actions"><button type="button" className="hire-secondary" onClick={()=>void save("draft")} disabled={busy}><Save size={14}/> {busy?"Saving…":"Save draft"}</button><button type="submit" className="hire-primary" disabled={busy}>{busy?"Submitting…":"Submit application"} <ArrowRight size={15}/></button></div>
  </form>}
  </section></section></main>
}
