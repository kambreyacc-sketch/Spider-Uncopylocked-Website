import { NextResponse } from "next/server";
import teamConfig from "@/data/team-config.json";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ConfigMember={id:string;roles:string[];bio:string;nitro:boolean;bannerOverride?:string};
const ROLE_ORDER=["Owners","Developer","Deputy Manager","Community Managers","Admins","Mods","Leakers"];
// The supplied Discord profile URLs contain IDs, but Discord does not expose the
// full user profile or guild join date to an unauthenticated website request.
// Return the configured roster without requiring a secret token so /team still works.
export async function GET(){
 const profiles=(teamConfig as ConfigMember[]).map((person)=>({
  ...person,
  username:`user-${person.id.slice(-4)}`,
  displayName:`Discord User ${person.id.slice(-4)}`,
  avatarUrl:"https://cdn.discordapp.com/embed/avatars/0.png",
  bannerUrl:person.bannerOverride||null,
  accentColor:null,
  joinedAt:null,
  publicFlags:0,
  badges:[],
  guildNickname:null
 }));
 const payload={roles:ROLE_ORDER.map(name=>({name,people:profiles.filter(p=>p.roles.includes(name))})),updatedAt:new Date().toISOString(),count:profiles.length,mode:"fallback"};
 return NextResponse.json(payload,{headers:{"Cache-Control":"no-store"}});
}
