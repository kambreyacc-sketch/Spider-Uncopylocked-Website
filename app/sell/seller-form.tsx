"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, ImagePlus, Upload, X } from "lucide-react";

const DRAFT_KEY = "spider-uncopylocked-listing-draft-v1";
type Draft = { title:string; type:"Game"|"UGC Group"; robloxUrl:string; price:string; description:string; imageData:string; imageName:string };\ntype RobloxPreview = { imageUrl:string; universeId:number };\nconst robloxLogo = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Roblox_Logo.svg";

export default function SellerForm() {
  const [draft,setDraft] = useState<Draft>({title:"",type:"Game",robloxUrl:"",price:"",description:"",imageData:"",imageName:""});
  const [error,setError] = useState("");
  const [saved,setSaved] = useState(false);\n  const [robloxPreview,setRobloxPreview] = useState<RobloxPreview|null>(null);\n  const [robloxPreviewStatus,setRobloxPreviewStatus] = useState("");
  useEffect(()=>{ try { const raw=window.localStorage.getItem(DRAFT_KEY); if(raw) setDraft(JSON.parse(raw) as Draft); } catch {} },[]);
  function update<K extends keyof Draft>(key:K,value:Draft[K]) { setDraft(current=>({...current,[key]:value})); setSaved(false); if(key==="robloxUrl"){setRobloxPreview(null);setRobloxPreviewStatus("");} }
  async function loadRobloxPreview() {
    const match=draft.robloxUrl.trim().match(/roblox\.com\/(?:games|places)\/(\d+)/i);
    if(!match){setRobloxPreviewStatus("Paste a public Roblox game URL containing its numeric place ID.");return;}
    setRobloxPreviewStatus("Loading Roblox thumbnail…");
    try { const response=await fetch("/api/roblox/thumbnail?placeId="+encodeURIComponent(match[1])); const data=await response.json(); if(!response.ok||!data.imageUrl) throw new Error(data.error||"Thumbnail unavailable."); setRobloxPreview({imageUrl:data.imageUrl,universeId:data.universeId}); setRobloxPreviewStatus("Public Roblox thumbnail loaded."); } catch(e) {setRobloxPreviewStatus(e instanceof Error?e.message:"Could not load the Roblox thumbnail.");}
  }
  function onImage(file?:File) {
    setError(""); if(!file)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setError("Use a PNG, JPG, or WebP image.");return;}
    if(file.size>5*1024*1024){setError("The image must be 5 MB or smaller.");return;}
    const reader=new FileReader(); reader.onload=()=>{if(typeof reader.result==="string")setDraft(current=>({...current,imageData:reader.result as string,imageName:file.name}));}; reader.readAsDataURL(file);
  }
  function saveDraft(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if(!draft.title.trim()){setError("Add a listing title first.");return;}
    if(!/^https?:\/\/(www\.)?roblox\.com\//i.test(draft.robloxUrl.trim())){setError("Enter the Roblox experience or group URL.");return;}
    if(!draft.price||Number(draft.price)<=0){setError("Enter an asking price greater than $0.");return;}
    try { window.localStorage.setItem(DRAFT_KEY,JSON.stringify(draft)); setSaved(true); }
    catch { setError("This draft is too large for browser storage. Try a smaller thumbnail."); }
  }
  return <form className="sell-form" onSubmit={saveDraft}>
    <section className="sell-form-section"><div className="sell-form-title"><span>01</span><div><h2>What are you selling?</h2><p>Choose the type of asset for this listing.</p></div></div>
      <div className="sell-type-options"><button type="button" className={draft.type==="Game"?"sell-type-option active":"sell-type-option"} onClick={()=>update("type","Game")}><span className="sell-type-icon">G</span><span><b>Roblox game</b><small>An experience or game you own</small></span><i /></button><button type="button" className={draft.type==="UGC Group"?"sell-type-option active":"sell-type-option"} onClick={()=>update("type","UGC Group")}><span className="sell-type-icon">UGC</span><span><b>UGC group</b><small>A Roblox group and its assets</small></span><i /></button></div>
    </section>
    <section className="sell-form-section"><div className="sell-form-title"><span>02</span><div><h2>Listing details</h2><p>Give buyers clear, accurate information.</p></div></div>
      <label className="sell-field">Listing title<input value={draft.title} onChange={e=>update("title",e.target.value)} maxLength={80} placeholder="Your game or group name" required /></label>
      <label className="sell-field">Roblox URL<input type="url" value={draft.robloxUrl} onChange={e=>update("robloxUrl",e.target.value)} placeholder="https://www.roblox.com/games/123456789/..." required /><small>For games, use the public Roblox experience URL.</small><button type="button" className="sell-fetch-thumbnail" onClick={loadRobloxPreview}>Load Roblox thumbnail</button>{robloxPreviewStatus&&<small className="sell-thumbnail-status">{robloxPreviewStatus}</small>}</label>
      <label className="sell-field">Asking price (USD)<div className="sell-price-input"><span>$</span><input type="number" min="1" step="1" value={draft.price} onChange={e=>update("price",e.target.value)} placeholder="0.00" required /></div></label>
      <label className="sell-field">Description<textarea value={draft.description} onChange={e=>update("description",e.target.value)} rows={5} maxLength={2000} placeholder="Describe what is included, the current status, and any important sale terms."/><small>{draft.description.length}/2000 characters</small></label>
    </section>
    <section className="sell-form-section"><div className="sell-form-title"><span>03</span><div><h2>Listing thumbnail</h2><p>Upload a clear image buyers will see in the marketplace.</p></div></div>
      <label className={"sell-upload "+(draft.imageData?"has-image":"")}>{draft.imageData?<><img src={draft.imageData} alt="Listing thumbnail preview"/><span className="sell-upload-overlay"><Upload size={16}/> Replace thumbnail</span></>:robloxPreview?<><img src={robloxPreview.imageUrl} alt="Roblox experience thumbnail"/><span className="sell-upload-overlay"><Upload size={16}/> Upload a custom thumbnail instead</span></>:<><span className="sell-upload-icon"><img src={robloxLogo} alt="Roblox logo"/></span><b>Use a Roblox thumbnail or upload your own</b><span>Paste a game URL above and load its public thumbnail.</span><span className="sell-upload-button"><Upload size={15}/> Upload image</span></>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onImage(e.target.files?.[0])}/></label>
      {draft.imageName&&<div className="sell-file-row"><span>{draft.imageName}</span><button type="button" onClick={()=>update("imageData","")} aria-label="Remove thumbnail"><X size={15}/> Remove</button></div>}
    </section>
    {error&&<div className="sell-message error"><AlertCircle size={17}/>{error}</div>}
    {saved&&<div className="sell-message success"><Check size={17}/><span><b>Draft saved on this browser.</b><br/>Only this browser can see the saved draft. It will not appear in Browse Listings yet. Public publishing needs a shared database and image storage so the listing and thumbnail can be saved for everyone.</span></div>}
    <div className="sell-form-actions"><button type="button" className="sell-secondary" onClick={()=>{setDraft({title:"",type:"Game",robloxUrl:"",price:"",description:"",imageData:"",imageName:""});setSaved(false);setError("");window.localStorage.removeItem(DRAFT_KEY);}}>Clear form</button><button className="sell-submit" type="submit">Save draft <ArrowRight size={16}/></button></div>
    <p className="sell-disclaimer">Save draft stores this form in this browser only. It does not publish a listing, verify ownership, or upload your thumbnail to permanent storage.</p>
  </form>;
}
