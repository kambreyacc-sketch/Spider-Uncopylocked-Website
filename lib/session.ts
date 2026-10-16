import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const ADMIN_DISCORD_ID = "1337293227820322878";
export const SPIDER_ADMIN_DISCORD_IDS = new Set(["1337293227820322878", "1404024989208019086"]);
export const SPIDER_SUPPORT_DISCORD_IDS = new Set(["1337293227820322878", "1404024989208019086", "1299695683955200051"]);
export type SpiderProfile = { id:string; username:string; displayName:string; avatar:string };
export async function getSpiderProfile(): Promise<SpiderProfile|null> {
 const secret=process.env.SESSION_SECRET; const raw=(await cookies()).get("spider_session")?.value;
 if(!secret||!raw)return null;
 const dot=raw.lastIndexOf("."); if(dot<1)return null;
 const payload=raw.slice(0,dot),signature=raw.slice(dot+1);
 const expected=createHmac("sha256",secret).update(payload).digest();
 let actual:Buffer; try{actual=Buffer.from(signature,"base64url")}catch{return null}
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
 try{const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {provider?:string;profile?:SpiderProfile;issuedAt?:number};
 if(data.provider!=="discord"||!data.profile?.id||!data.profile.username||!data.issuedAt||Date.now()-data.issuedAt>7*24*60*60*1000||data.issuedAt>Date.now()+60000)return null;
 return data.profile;}catch{return null}
}
export async function isSpiderAdmin(){const user=await getSpiderProfile();return !!user&&SPIDER_ADMIN_DISCORD_IDS.has(user.id);}
export async function isSpiderSupportStaff(){const user=await getSpiderProfile();return !!user&&SPIDER_SUPPORT_DISCORD_IDS.has(user.id);}
