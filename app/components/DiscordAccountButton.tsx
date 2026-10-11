"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowUpRight,LogOut,ShieldCheck} from "lucide-react";
type Profile={id:string;username:string;displayName:string;avatar:string};
export default function DiscordAccountButton(){const [user,setUser]=useState<Profile|null>(null);useEffect(()=>{let live=true;fetch("/api/auth/discord/me",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(live)setUser(d.user??null)}).catch(()=>{});return()=>{live=false}},[]);
if(!user)return <Link href="/api/auth/discord/login" className="spider-signin">Sign in with Discord <ArrowUpRight size={14}/></Link>;
return <div className="spider-account-actions">{user.id==="1337293227820322878"&&<Link href="/admin" className="spider-admin-link"><ShieldCheck size={14}/> Admin</Link>}<Link href="/settings" className="spider-account-pill" title={user.displayName}><img src={user.avatar||"https://cdn.discordapp.com/embed/avatars/0.png"} alt=""/><span>{user.displayName||user.username}</span></Link><button className="spider-logout" title="Sign out" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"}).catch(()=>{});window.location.reload()}}><LogOut size={14}/></button></div>}
