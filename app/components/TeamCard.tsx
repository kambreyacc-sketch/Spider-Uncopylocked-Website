"use client";
import { Award, BadgeCheck, Bot, Bug, CalendarDays, Code2, Handshake, Heart, Lightbulb, Scale, ShieldCheck, Swords } from "lucide-react";
const iconMap:Record<string,any>={"shield-check":ShieldCheck,handshake:Handshake,calendar:CalendarDays,bug:Bug,swords:Swords,lightbulb:Lightbulb,scale:Scale,heart:Heart,bot:Bot,code:Code2};
type Badge={key:string;label:string;icon:string};
export type TeamPerson={id:string;username:string;displayName:string;avatarUrl:string;bannerUrl:string|null;accentColor:string|null;joinedAt:string|null;bio:string;nitro:boolean;nitroBadge?:string;roles:string[];badges:Badge[]};
const badgeColors:Record<string,{main:string;dark:string;light:string;shine:string}>={bronze:{main:"#f07818",dark:"#57200b",light:"#ffbd52",shine:"#ffd98b"},silver:{main:"#9eabb5",dark:"#28333d",light:"#e4edf2",shine:"#ffffff"},gold:{main:"#f5a900",dark:"#63300a",light:"#ffd85d",shine:"#fff0ad"},platinum:{main:"#16bde9",dark:"#07516e",light:"#74eeff",shine:"#d0fbff"},diamond:{main:"#bb42f2",dark:"#43117d",light:"#e98cff",shine:"#ffd6ff"},emerald:{main:"#38d817",dark:"#135c10",light:"#b6ff37",shine:"#edff9e"},ruby:{main:"#f02e65",dark:"#721239",light:"#ff83a2",shine:"#ffd4dc"},opal:{main:"#7eeaff",dark:"#4d3bc0",light:"#ffffff",shine:"#f5ffff"}};
function NitroBadge({kind}:{kind:string}) {
 const c=badgeColors[kind]||badgeColors.gold;
 const opal=kind==="opal", winged=opal||kind==="ruby"||kind==="emerald";
 return <svg className="team-nitro-badge-image" viewBox="0 0 64 64" role="img" aria-label={kind+" Nitro milestone badge"}>
 <defs><radialGradient id={"face-"+kind} cx="38%" cy="25%" r="80%"><stop stopColor={c.light}/><stop offset=".36" stopColor={c.main}/><stop offset="1" stopColor={c.dark}/></radialGradient><linearGradient id={"edge-"+kind} x1="0" y1="0" x2="1" y2="1"><stop stopColor={c.shine}/><stop offset=".5" stopColor={c.main}/><stop offset="1" stopColor={c.dark}/></linearGradient></defs>
 {winged&&<path d="M8 22 2 13 5 32 0 40 14 47 20 39 16 28 8 22M56 22 62 13 59 32 64 40 50 47 44 39 48 28Z" fill={c.main} stroke={c.light} strokeWidth="1.5"/>}
 {opal&&<path d="M7 20 0 11 12 14 18 23M57 20 64 11 52 14 46 23M7 44 0 53 12 50 18 41M57 44 64 53 52 50 46 41" fill={c.light} stroke={c.main} strokeWidth="1.5"/>}
 <circle cx="32" cy="32" r="28" fill={c.dark} stroke={c.main} strokeWidth="2.5"/>
 <circle cx="32" cy="32" r="24" fill={"url(#edge-"+kind+")"} stroke={c.light} strokeWidth="1.2"/>
 <circle cx="32" cy="32" r="19" fill={"url(#face-"+kind+")"} stroke={c.dark} strokeWidth="2"/>
 <circle cx="32" cy="32" r="14" fill={c.dark} stroke={c.main} strokeWidth="1.4"/>
 <path d="M17 24 25 24 28 29 42 29 45 34 40 39 29 39 26 35 19 35 16 30Z" fill={c.light} stroke={c.dark} strokeWidth="1"/>
 <path d="M25 25 31 25 34 30 46 30 48 35 42 40 33 40 30 35 23 35 21 30Z" fill={c.shine} opacity=".9"/>
 <circle cx="39" cy="34" r="5.5" fill={c.main} stroke={c.dark} strokeWidth="1.7"/><circle cx="39" cy="34" r="2.1" fill={c.dark}/>
 {Array.from({length:8},(_,i)=><path key={i} d="M32 3 35 8 32 11 29 8Z" fill={i%2===0?c.shine:c.main} transform={"rotate("+(i*45)+" 32 32)"} />)}
 {(kind==="gold"||kind==="opal"||kind==="diamond")&&<path d="M32 0 35 7 32 12 29 7Z M4 32 10 29 13 32 10 35Z M60 32 54 29 51 32 54 35Z" fill={c.shine} stroke={c.main} strokeWidth=".8"/>}
 {opal&&<><path d="M17 8 23 11 19 16Z M47 8 41 11 45 16Z M17 56 23 53 19 48Z M47 56 41 53 45 48Z" fill={c.light}/><path d="M13 17 5 10 9 22M51 17 59 10 55 22" fill="none" stroke={c.light} strokeWidth="3"/></>}
 </svg>;
}
export default function TeamCard({person,role}:{person:TeamPerson;role:string}){const since=person.joinedAt?new Date(person.joinedAt).toLocaleDateString("en-US",{month:"short",year:"numeric"}):"Unknown";return <article className="team-card"><div className="team-card-banner" style={person.bannerUrl?{backgroundImage:`linear-gradient(180deg,transparent,#11131855),url("${person.bannerUrl}")`,backgroundColor:person.accentColor||"#252a36"}:{backgroundColor:person.accentColor||"#252a36"}}/><div className="team-card-body"><img className="team-avatar" src={person.avatarUrl} alt={person.displayName} loading="lazy"/><div className="team-card-heading"><div className="team-name-line"><h3 style={{color:person.accentColor||"#75aaff"}}>{person.displayName}</h3>{person.badges.slice(0,4).map(b=>{const Icon=iconMap[b.icon]||Award;return <span className="team-discord-badge" key={b.key} title={b.label} aria-label={b.label}><Icon size={14}/></span>})}{person.nitro&&<span className="team-nitro-badge"><NitroBadge kind={person.nitroBadge||"gold"}/></span>}</div><span className="team-role-pill">{role}</span><span className="team-username">@{person.username}</span></div><div className="team-meta"><div><span>ID</span><code>{person.id}</code></div><div><span>MEMBER SINCE</span><code>{since}</code></div></div><p className="team-bio">{person.bio.trim()||"Spider Uncopylocked team member."}</p><div className="team-card-footer"><span>SPIDER UNCOPYLOCKED</span><span>{person.roles.length>1?`+${person.roles.length-1} role${person.roles.length>2?"s":""}`:"STAFF"}</span></div></div></article>}
