import Link from "next/link";
import { redirect } from "next/navigation";
import { getSpiderProfile, isSpiderAdmin } from "../../lib/session";
import { Activity, ShieldAlert, Users, BriefcaseBusiness, Building2, MessagesSquare, ChartNoAxesCombined, ClipboardList, ArrowUpRight, LockKeyhole, ShieldCheck, UserRoundSearch, FileWarning, Settings, LayoutDashboard } from "lucide-react";
import SpiderSidebar from "../components/SpiderSidebar";
import AdminOverview from "./ui";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 if(!(await isSpiderAdmin())){const user=await getSpiderProfile();return <main className="admin-denied"><div><LockKeyhole size={36}/><p className="admin-kicker">SPIDER UNCOPYLOCKED / RESTRICTED AREA</p><h1>Access denied</h1><p>This dashboard is limited to an authorized administrator account. Sign in with the correct Discord account to continue.</p><Link href="/">Return to Spider Uncopylocked</Link>{!user&&<Link href="/api/auth/discord/login">Sign in with Discord</Link>}</div></main>}
 const user=await getSpiderProfile();
 return <div className="admin-layout"><SpiderSidebar/><main className="admin-main"><header className="admin-top"><div><span className="admin-kicker">SPIDER UNCOPYLOCKED / CONTROL CENTER</span><h1>Admin dashboard</h1><p>Moderation, marketplace activity, and platform operations.</p></div><div className="admin-identity">{user?.avatar?<img src={user.avatar} alt=""/>:<span/>}<div><b>{user?.displayName}</b><small>Administrator</small></div><ShieldCheck size={18}/></div></header><AdminOverview/></main></div>
}
