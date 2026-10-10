"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

async function uploadFile(url:string,file:File) {
  const response=await fetch(url,{method:"POST",headers:{"Content-Type":file.type||"application/octet-stream"},body:file});
  if(!response.ok) throw new Error("File upload failed. Try again with a smaller file.");
  return (await response.json()).storageId as string;
}

export default function UploadResourcePage() {
  const generateUploadUrl=useMutation(api.resources.generateUploadUrl);
  const publish=useMutation(api.resources.publish);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [category,setCategory]=useState<"Model"|"Script"|"Template"|"Other">("Template");
  const [setup,setSetup]=useState("");
  const [creatorName,setCreatorName]=useState("");
  const [thumbnail,setThumbnail]=useState<File|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setMessage("");
    if(!file){setMessage("Choose the asset file you want to share.");return;}
    if(file.size>50*1024*1024){setMessage("Files must be 50 MB or smaller.");return;}
    if(thumbnail&&(!thumbnail.type.startsWith("image/")||thumbnail.size>5*1024*1024)){setMessage("Thumbnail must be an image under 5 MB.");return;}
    setBusy(true);
    try {
      const fileUrl=await generateUploadUrl();
      const fileStorageId=await uploadFile(fileUrl,file);
      let thumbnailStorageId:any=undefined;
      if(thumbnail){const imageUrl=await generateUploadUrl();thumbnailStorageId=await uploadFile(imageUrl,thumbnail);}
      await publish({title:title.trim(),description:description.trim(),category,setup:setup.trim()||undefined,creatorName:creatorName.trim(),fileStorageId:fileStorageId as any,thumbnailStorageId:thumbnailStorageId as any,fileName:file.name,fileSize:file.size});
      setMessage("Published! Your free asset is now in the library.");
      setTitle("");setDescription("");setSetup("");setFile(null);setThumbnail(null);
    } catch(err){setMessage(err instanceof Error?err.message:"Upload failed. Please try again.");}
    finally{setBusy(false);}
  }
  const field:React.CSSProperties={width:"100%",padding:12,marginTop:7,border:"1px solid #393149",borderRadius:9,background:"#111019",color:"#f4f2ff"};
  return <main style={{minHeight:"100vh",background:"#0b0b12",color:"#f4f2ff",padding:"32px 20px",fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:760,margin:"0 auto"}}><Link href="/resources" style={{color:"#c7b4ff"}}>← Free asset library</Link><p style={{color:"#b99cff",letterSpacing:2,fontSize:12,marginTop:32}}>COMMUNITY CONTRIBUTION</p><h1 style={{fontSize:"clamp(32px,5vw,48px)",margin:"10px 0"}}>Share a free asset.</h1><p style={{color:"#aaa8bc",lineHeight:1.7}}>Give it a name, add a preview image and useful instructions, then upload the actual file. Allowed types include Roblox models, scripts, templates, and other creator files.</p>
    <form onSubmit={submit} style={{marginTop:28,display:"grid",gap:18,padding:24,border:"1px solid #30283f",borderRadius:16,background:"#15141e"}}>
      <label>Asset name<input required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Smooth sprint system" style={field}/></label>
      <label>Category<select value={category} onChange={e=>setCategory(e.target.value as any)} style={field}><option>Template</option><option>Model</option><option>Script</option><option>Other</option></select></label>
      <label>Thumbnail / preview image <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setThumbnail(e.target.files?.[0]||null)} style={field}/><small style={{color:"#8e8a9f"}}>Optional. Use an image up to 5 MB.</small></label>
      <label>Upload the actual asset file <input required type="file" onChange={e=>setFile(e.target.files?.[0]||null)} style={field}/><small style={{color:"#8e8a9f"}}>Required · 50 MB maximum. Only upload files you have permission to share.</small></label>
      <label>Description<textarea required maxLength={3000} rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What does this asset do? What is included?" style={field}/></label>
      <label>How to set it up (optional)<textarea maxLength={5000} rows={5} value={setup} onChange={e=>setSetup(e.target.value)} placeholder="Where to place it in Studio, dependencies, configuration steps…" style={field}/></label>
      <label>Creator name<input required maxLength={60} value={creatorName} onChange={e=>setCreatorName(e.target.value)} placeholder="Your creator / Discord display name" style={field}/></label>
      {message&&<p role="status" style={{padding:12,borderRadius:8,background:"#211b30",color:"#d5c7ff"}}>{message}</p>}
      <button disabled={busy} type="submit" style={{border:0,borderRadius:10,padding:14,background:busy?"#4b3d70":"#7042ef",color:"white",fontWeight:700,cursor:busy?"wait":"pointer"}}>{busy?"Uploading…":"Publish free asset"}</button>
    </form></div></main>;
}
