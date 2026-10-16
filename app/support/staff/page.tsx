import Link from "next/link";
import { redirect } from "next/navigation";
import { getSpiderProfile, isSpiderSupportStaff } from "../../../lib/session";
import SupportAdminPanel from "../../admin/support-panel";
export const dynamic = "force-dynamic";
export default async function SupportStaffPage() {
  if (!(await isSpiderSupportStaff())) {
    const user = await getSpiderProfile();
    if (!user) redirect("/api/auth/discord/login");
    redirect("/support");
  }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-[1500px]"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-white/40">Spider Uncopylocked / Private staff area</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Support ticket inbox</h1><p className="mt-2 text-sm text-white/50">Private queue for authorized support staff only.</p></div><Link href="/support" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[.05]">← Support Center</Link></div><SupportAdminPanel /></div></main>;
}
