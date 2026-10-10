"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AlertCircle, ArrowRight, Check, Upload, X } from "lucide-react";

const DRAFT_KEY = "spider-uncopylocked-listing-draft-v1";
type Draft = { title:string; type:"Game"|"UGC Group"; robloxUrl:string; price:string; description:string; imageData:string; imageName:string; sellerName:string; sellerRobloxId:string; contactDiscord:string; contactEmail:string; contactPhone:string };
type RobloxPreview = { imageUrl:string; universeId:number };
const robloxLogo = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Roblox_Logo.svg";

export default function SellerForm() {
  const [draft,setDraft] = useState<Draft>({title:"",type:"Game",robloxUrl:"",price:"",description:"",imageData:"",imageName:"",sellerName:"",sellerRobloxId:"",contactDiscord:"",contactEmail:"",contactPhone:""});
  const [error,setError] = useState("");
  const [saved,setSaved] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [robloxPreview,setRobloxPreview] = useState<RobloxPreview|null>(null);
  const [robloxPreviewStatus,setRobloxPreviewStatus] = useState("");
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);
  const submitListing = useMutation(api.listings.submitListing);
  useEffect(()=>{ try { const raw=window.localStorage.getItem(DRAFT_KEY); if(raw) setDraft(current=>({...current,...JSON.parse(raw)})); } catch {} },[]);
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
    try { window.localStorage.setItem(DRAFT_KEY,JSON.stringify(draft)); setSaved(true); }
    catch { setError("This draft is too large for browser storage. Try a smaller thumbnail."); }
  }
  async function publishListing() {
    setError(""); setSaved(false);
    if(!draft.title.trim()){setError("Add a listing title first.");return;}
    if(!/^https?:\/\/(www\.)?roblox\.com\//i.test(draft.robloxUrl.trim())){setError("Enter the Roblox experience or group URL.");return;}
    if(!draft.price||Number(draft.price)<=0){setError("Enter an asking price greater than $0.");return;}
    if(!draft.sellerName.trim()||!draft.sellerRobloxId.trim()){setError("Add your Roblox username and numeric Roblox user ID.");return;}
    if(!(draft.contactDiscord.trim()||draft.contactEmail.trim()||draft.contactPhone.trim())){setError("Add at least one contact method: Discord, email, or phone.");return;}
    setSubmitting(true);
    try {
      let imageStorageId: string | undefined;
      if(draft.imageData) {
        const uploadUrl=await generateUploadUrl({});
        const response=await fetch(draft.imageData);
        const blob=await response.blob();
        const uploaded=await fetch(uploadUrl,{method:"POST",headers:{"Content-Type":blob.type},body:blob});
        if(!uploaded.ok) throw new Error("Thumbnail upload failed. Try a smaller image.");
        imageStorageId=(await uploaded.json()).storageId as string;
      } else if(robloxPreview?.imageUrl) {
        // Keep the Roblox thumbnail URL as a reference when the seller uses the public game image.
      }
      await submitListing({
        title:draft.title.trim(), type:draft.type, robloxUrl:draft.robloxUrl.trim(),
        price:Number(draft.price), description:draft.description.trim(),
        imageStorageId: imageStorageId as never,
        imageUrl: !imageStorageId ? (robloxPreview?.imageUrl || undefined) : undefined,
        sellerName:draft.sellerName.trim(), sellerRobloxId:draft.sellerRobloxId.trim(),
        contactDiscord:draft.contactDiscord.trim()||undefined, contactEmail:draft.contactEmail.trim()||undefined, contactPhone:draft.contactPhone.trim()||undefined
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setSaved(true);
      setError("");
    } catch(e) { setError(e instanceof Error ? e.message : "Could not submit listing. Make sure the backend has been deployed and try again."); }
    finally { setSubmitting(false); }
  }
  return <form className="sell-form" onSubmit={saveDraft}>
    <section className="sell-form-section"><div className="sell-form-title"><span>01</span><div><h2>What are you selling?</h2><p>Choose the type of asset for this listing.</p></div></div>
      <div className="sell-type-options"><button type="button" className={draft.type==="Game"?"sell-type-option active":"sell-type-option"} onClick={()=>update("type","Game")}><span className="sell-type-icon">G</span><span><b>Roblox game</b><small>An experience or game you own</small></span><i /></button><button type="button" className={draft.type==="UGC Group"?"sell-type-option active":"sell-type-option"} onClick={()=>update("type","UGC Group")}><span className="sell-type-icon">UGC</span><span><b>UGC group</b><small>A Roblox group and its assets</small></span><i /></button></div>
    </section>
    <section className="sell-form-section"><div className="sell-form-title"><span>02</span><div><h2>Listing details</h2><p>Give buyers clear, accurate information.</p></div></div>
      <label className="sell-field">Listing title<input value={draft.title} onChange={e=>update("title",e.target.value)} maxLength={80} placeholder="Your game or group name" required /></label>
      <label className="sell-field">{draft.type==="Game"?"Roblox game URL":"Roblox group URL"}<input type="url" value={draft.robloxUrl} onChange={e=>update("robloxUrl",e.target.value)} placeholder={draft.type==="Game"?"https://www.roblox.com/games/123456789/...":"https://www.roblox.com/communities/123456789/..."} required /><small>{draft.type==="Game"?"Use the public experience URL.":"Use the public group/community URL for the UGC group you are listing."}</small><button type="button" className="sell-fetch-thumbnail" onClick={loadRobloxPreview}>Load Roblox thumbnail</button>{robloxPreviewStatus&&<small className="sell-thumbnail-status">{robloxPreviewStatus}</small>}</label>
      <label className="sell-field">Asking price (USD)<div className="sell-price-input"><span>$</span><input type="number" min="1" step="1" value={draft.price} onChange={e=>update("price",e.target.value)} placeholder="0.00" required /></div></label>
      <label className="sell-field">Roblox username<input value={draft.sellerName} onChange={e=>update("sellerName",e.target.value)} placeholder="Your Roblox username" required /></label>
      <label className="sell-field">Roblox user ID<input inputMode="numeric" value={draft.sellerRobloxId} onChange={e=>update("sellerRobloxId",e.target.value)} placeholder="Your numeric Roblox user ID" required /><small>Your Roblox user ID is saved with the listing.</small></label>
      <label className="sell-field">{draft.type==="Game"?"Game details":"UGC group details"}<textarea value={draft.description} onChange={e=>update("description",e.target.value)} rows={5} maxLength={2000} placeholder={draft.type==="Game"?"Describe gameplay, monetization, and what is included.":"Describe the group, catalog/UGC assets, ownership, and what is included."}/><small>{draft.description.length}/2000 characters</small></label>
    </section>
    <section className="sell-form-section"><div className="sell-form-title"><span>03</span><div><h2>Listing thumbnail</h2><p>Upload a clear image buyers will see in the marketplace.</p></div></div>
      <label className={"sell-upload "+(draft.imageData?"has-image":"")}>{draft.imageData?<><img src={draft.imageData} alt="Listing thumbnail preview"/><span className="sell-upload-overlay"><Upload size={16}/> Replace thumbnail</span></>:robloxPreview?<><img src={robloxPreview.imageUrl} alt="Roblox experience thumbnail"/><span className="sell-upload-overlay"><Upload size={16}/> Upload a custom thumbnail instead</span></>:<><span className="sell-upload-icon"><img src={robloxLogo} alt="Roblox logo"/></span><b>Use a Roblox thumbnail or upload your own</b><span>Paste a game URL above and load its public thumbnail.</span><span className="sell-upload-button"><Upload size={15}/> Upload image</span></>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onImage(e.target.files?.[0])}/></label>
      {draft.imageName&&<div className="sell-file-row"><span>{draft.imageName}</span><button type="button" onClick={()=>update("imageData","")} aria-label="Remove thumbnail"><X size={15}/> Remove</button></div>}
    </section>
    <section className="sell-form-section"><div className="sell-form-title"><span>04</span><div><h2>Seller contact</h2><p>Add at least one way for interested buyers to reach you.</p></div></div>
      <label className="sell-field">Discord username<input value={draft.contactDiscord} onChange={e=>update("contactDiscord",e.target.value)} placeholder="Your Discord username" /></label>
      <label className="sell-field">Email address<input type="email" value={draft.contactEmail} onChange={e=>update("contactEmail",e.target.value)} placeholder="you@example.com" /></label>
      <label className="sell-field">Phone number<input type="tel" value={draft.contactPhone} onChange={e=>update("contactPhone",e.target.value)} placeholder="Optional phone number" /></label><small>At least one contact method is required. Only share contact details you are comfortable showing to potential buyers.</small>
    </section>
    {error&&<div className="sell-message error"><AlertCircle size={17}/>{error}</div>}
    {saved&&<div className="sell-message success"><Check size={17}/><span><b>Listing published!</b><br/>Your listing is now live in the marketplace.</span></div>}
    <div className="sell-form-actions"><button type="button" className="sell-secondary" onClick={()=>{setDraft({title:"",type:"Game",robloxUrl:"",price:"",description:"",imageData:"",imageName:"",sellerName:"",sellerRobloxId:"",contactDiscord:"",contactEmail:"",contactPhone:""});setSaved(false);setError("");window.localStorage.removeItem(DRAFT_KEY);}}>Clear form</button><button type="submit" className="sell-secondary">Save draft</button><button className="sell-submit" type="button" onClick={publishListing} disabled={submitting}>{submitting?"Submitting…":"Publish listing"} <ArrowRight size={16}/></button></div>
    <p className="sell-disclaimer">Listings publish immediately and are not manually reviewed. Roblox ownership is not automatically verified, so buyers should independently verify details before any transfer or payment.</p>
  </form>;
}
