"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ResourcesPage() {
  const resources = useQuery(api.resources.list, {});
  return <main style={{minHeight:"100vh",background:"#0b0b12",color:"#f4f2ff",padding:"36px max(20px,calc((100vw - 1120px)/2))",fontFamily:"Arial,sans-serif"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:36}}>
      <Link href="/" style={{color:"#c7b4ff"}}>← Spider Uncopylocked</Link>
      <Link href="/resources/upload" style={{background:"#7042ef",padding:"12px 18px",borderRadius:10,color:"white"}}>＋ Upload free asset</Link>
    </header>
    <p style={{color:"#b99cff",letterSpacing:2,fontSize:12}}>COMMUNITY RESOURCE LIBRARY</p>
    <h1 style={{fontSize:"clamp(32px,5vw,54px)",margin:"10px 0"}}>Free assets. Made by creators.</h1>
    <p style={{color:"#aaa8bc",maxWidth:680,lineHeight:1.7}}>Browse community-shared Roblox models, scripts, templates, and other files. Each resource can include a thumbnail, description, and setup instructions.</p>
    {resources === undefined ? <p style={{marginTop:32,color:"#aaa8bc"}}>Loading assets…</p> : resources.length === 0 ? <section style={{marginTop:32,padding:28,border:"1px solid #30283f",borderRadius:16,background:"#15141e"}}><h2>No assets uploaded yet</h2><p style={{color:"#aaa8bc"}}>Be the first to share a free template, model, or script.</p><Link href="/resources/upload" style={{color:"#c7b4ff"}}>Upload the first asset →</Link></section> : <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18,marginTop:32}}>{resources.map((item:any)=><article key={item._id} style={{border:"1px solid #30283f",borderRadius:16,overflow:"hidden",background:"#15141e"}}>{item.thumbnailUrl?<img src={item.thumbnailUrl} alt="" style={{width:"100%",height:160,objectFit:"cover"}}/>:<div style={{height:160,display:"grid",placeItems:"center",background:"#201a30",fontSize:36}}>▧</div>}<div style={{padding:18}}><small style={{color:"#bd9fff"}}>{item.category.toUpperCase()}</small><h2 style={{fontSize:20,margin:"8px 0"}}>{item.title}</h2><p style={{color:"#aaa8bc",lineHeight:1.6}}>{item.description}</p>{item.setup&&<details style={{margin:"12px 0"}}><summary style={{cursor:"pointer",color:"#c7b4ff"}}>Setup instructions</summary><p style={{whiteSpace:"pre-wrap",color:"#aaa8bc"}}>{item.setup}</p></details>}<p style={{fontSize:12,color:"#8e8a9f"}}>By {item.creatorName} · {(item.fileSize/1024/1024).toFixed(2)} MB</p>{item.downloadUrl?<a href={item.downloadUrl} download={item.fileName} style={{display:"inline-block",marginTop:8,background:"#7042ef",padding:"10px 14px",borderRadius:9,color:"white"}}>Download free file</a>:<p>Download unavailable</p>}</div></article>)}</section>}
  </main>;
}
