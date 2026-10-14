"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useQuery} from "convex/react";
import {api} from "../../convex/_generated/api";
import SpiderSidebar from "../components/SpiderSidebar";
import {Search,Star,ArrowUpRight,SlidersHorizontal,ArrowUpRight as External, BriefcaseBusiness, CircleDollarSign} from "lucide-react";
const crafts=["All","Scripting","Building","UI/UX","3D Modeling","Animation","VFX","GFX","Audio"];
export default function DevelopersPage(){
 const [craft,setCraft]=useState("All"),[search,setSearch]=useState(""),[sort,setSort]=useState("newest"),[user,setUser]=useState<any>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const q=params.get("search");if(q)setSearch(q)},[]);
 const people=useQuery(api.developers.list,{craft,search:search||undefined,sort:sort as any});
 useEffect(()=>{fetch("/api/auth/discord/me").then(r=>r.json()).then(d=>setUser(d.user)).catch(()=>{});},[]);
 return <main className="market-shell spider-directory"><SpiderSidebar/><section className="market-content">
  <header className="creator-directory-hero"><div><span className="spider-eyebrow">SPIDER / CREATOR NETWORK</span><h1>Find your next<br/><span>great developer.</span></h1><p>Explore real portfolios, compare specialties and rates, then contact creators directly.</p><div className="creator-directory-stats"><span><BriefcaseBusiness size={15}/> Portfolio-first profiles</span><span><CircleDollarSign size={15}/> Clear starting rates</span></div></div><Link href={user?"/become-developer":"/api/auth/discord/login"} className="hire-primary">Publish your profile <ArrowUpRight size={15}/></Link></header>
  <div className="creator-browse-head"><div><h2>Explore developers</h2><p>Search by role, skill, or service.</p></div><span className="creator-result-count">{people===undefined?"Loading…":people.length+" creators"}</span></div>
  <div className="hire-toolbar creator-search-toolbar"><label className="hire-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try “Luau scripter”, “UI designer”, or a skill"/></label><label className="hire-sort"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Recently joined</option><option value="rating">Top rated</option><option value="price">Lowest starting rate</option></select></label></div>
  <div className="hire-chips creator-filter-chips">{crafts.map(c=><button key={c} className={craft===c?"selected":""} onClick={()=>setCraft(c)}>{c}</button>)}</div>
  {people===undefined?<div className="hire-empty">Loading developer portfolios…</div>:people.length===0?<div className="hire-empty"><h2>No matching developers yet</h2><p>Try another skill or be the first creator listed in this category.</p><Link href="/become-developer" className="hire-primary">Create your profile <ArrowUpRight size={15}/></Link></div>:<div className="creator-portfolio-grid">{people.map((d:any)=><Link href={"/developers/"+d.username} className="creator-portfolio-card" key={d._id}>
   <div className="creator-work-grid">{d.portfolio.slice(0,3).map((p:any,i:number)=><div className={"creator-work-image work-image-"+i} key={p.url+i}><img src={p.url} alt={p.caption||"Portfolio preview"} loading="lazy"/>{i===0&&<span>PORTFOLIO</span>}</div>)}</div>
   <div className="creator-card-body"><div className="creator-card-person"><span className="creator-person-avatar">{d.avatarUrl ? <img src={d.avatarUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}<span className="creator-avatar-initial" aria-hidden="true">{String(d.displayName || d.username || "?").slice(0, 1).toUpperCase()}</span></span><div><h3>{d.displayName}{d.verified&&<span className="verified-tag">Verified</span>}</h3><small>@{d.username}</small></div><ArrowUpRight className="creator-card-arrow" size={17}/></div>
    <p className="creator-card-headline">{d.headline}</p><div className="developer-tags creator-skill-tags">{[...d.crafts,...d.skills].slice(0,5).map((tag:string)=><span key={tag}>{tag}</span>)}</div>
    <div className="creator-card-meta"><span className={d.availability==="Available"?"status-available":"status-busy"}>{d.availability}</span><span className="creator-card-rating"><Star size={13} fill="currentColor"/> {d.rating?d.rating.toFixed(1):"New"} <small>({d.reviewCount})</small></span></div>
    <div className="creator-card-rate"><small>STARTING RATE</small><strong>{d.rateType==="negotiable"?"Contact for quote":d.rateType==="hourly"?"$"+(d.rateAmount??0)+" / hour":"$"+(d.rateAmount??0)+" / project"}</strong></div>
   </div>
  </Link>)}</div>}
  <p className="hire-disclaimer">Review portfolios and agree on scope, milestones, and payment terms directly with each developer.</p>
 </section></main>;
}
