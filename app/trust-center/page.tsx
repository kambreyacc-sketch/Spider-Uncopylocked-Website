import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import { ShieldCheck, ShieldAlert, LockKeyhole, SearchCheck, FileCheck2, ArrowUpRight, CheckCircle2, CircleHelp } from "lucide-react";

const principles = [
  { icon: LockKeyhole, title: "Account-first privacy", body: "Reports and account actions require a signed-in Discord session. Never include passwords, session tokens, recovery codes, or payment-card details." },
  { icon: SearchCheck, title: "Evidence over assumptions", body: "Provide direct links, dates, and clear context. A report is a request for review—not proof that someone has done something wrong." },
  { icon: FileCheck2, title: "Management review", body: "Sensitive decisions stay with management. Public information should never expose private reports, evidence, or reporter identity." },
];

const checklist = [
  "Check a creator’s portfolio and ask questions before agreeing to work.",
  "Write down scope, deadlines, ownership, and payment milestones before starting.",
  "Be cautious of urgent payment demands, impersonators, and suspicious links.",
  "Keep communications and evidence relevant to the issue you are reporting.",
];

export const metadata = {
  title: "Trust & Safety Center | Spider Uncopylocked",
  description: "Safety guidance, reporting options, and trust standards for the Spider Uncopylocked community.",
};

export default function TrustSafetyCenterPage() {
  return (
    <main className="market-shell">
      <SpiderSidebar />
      <section className="market-content">
        <div className="hire-page-head" style={{ alignItems: "flex-start" }}>
          <div>
            <span className="spider-eyebrow">SPIDER / COMMUNITY STANDARDS</span>
            <h1>Trust &amp; Safety Center</h1>
            <p>Practical guidance to help creators collaborate with more confidence.</p>
          </div>
          <ShieldCheck size={34} aria-hidden="true" />
        </div>

        <section className="hire-panel" style={{ marginBottom: 18, padding: "clamp(20px, 3vw, 30px)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ border: "1px solid #45454b", background: "linear-gradient(145deg,#262629,#151517)", borderRadius: 12, padding: 12, flexShrink: 0 }}>
              <ShieldCheck size={23} />
            </div>
            <div>
              <span className="spider-eyebrow">OUR APPROACH</span>
              <h2 style={{ margin: "7px 0 8px" }}>A safer space to build together.</h2>
              <p style={{ margin: 0, color: "#b8b8c0", lineHeight: 1.8 }}>
                Spider offers tools and guidance for the community, but it does not process commission payments, hold funds, or guarantee off-site transactions. Use clear agreements and report concerns through the signed-in reporting flow.
              </p>
            </div>
          </div>
        </section>

        <div className="safety-grid" style={{ marginBottom: 22 }}>
          {principles.map(({ icon: Icon, title, body }) => (
            <article className="hire-panel safety-card" key={title}>
              <Icon size={22} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <section className="hire-panel" style={{ padding: "clamp(20px, 3vw, 28px)", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <CheckCircle2 size={20} aria-hidden="true" />
            <h2 style={{ margin: 0 }}>Before you work with someone</h2>
          </div>
          <ul style={{ display: "grid", gap: 12, paddingLeft: 22, color: "#c8c8ce", lineHeight: 1.75 }}>
            {checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="hire-panel" style={{ padding: "clamp(20px, 3vw, 28px)", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <ShieldAlert size={21} aria-hidden="true" />
            <h2 style={{ margin: 0 }}>Need to raise a concern?</h2>
          </div>
          <p style={{ color: "#b8b8c0", lineHeight: 1.8 }}>
            Sign in with Discord to submit a report. Reports are private and routed for review; please include only relevant details and evidence you are allowed to share.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Link href="/report-scam" className="spider-button-primary">Submit a report <ArrowUpRight size={16} /></Link>
            <Link href="/scam-logs" className="spider-button-secondary">View public scam logs <ArrowUpRight size={16} /></Link>
            <Link href="/guidelines" className="spider-button-secondary">Safety guidelines <CircleHelp size={16} /></Link>
          </div>
          <p style={{ fontSize: 12, color: "#92929b", marginTop: 16, lineHeight: 1.7 }}>
            Public logs may contain allegations and are not a substitute for a formal review. Avoid posting private personal information or making claims you cannot substantiate.
          </p>
        </section>

        <p style={{ color: "#8f8f98", fontSize: 12, lineHeight: 1.7 }}>
          Safety tools do not replace platform support or emergency services. For account compromise, secure your Discord and Roblox accounts directly through their official recovery processes.
        </p>
      </section>
    </main>
  );
}
