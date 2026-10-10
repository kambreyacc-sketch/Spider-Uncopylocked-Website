import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ChevronRight, FileText, ShieldCheck } from "lucide-react";

type Section={title:string;body:string[]};
export default function LegalPage({eyebrow,title,updated,intro,sections}:{eyebrow:string;title:string;updated:string;intro:string;sections:Section[]}){
 const links=[["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Community Guidelines","/guidelines"],["Fees & Payments","/fees"],["How It Works","/how-it-works"],["FAQ","/faq"],["Contact & Support","/contact"]];
 return <main className="legal-page">
  <header className="legal-topbar"><Link href="/marketplace" className="legal-brand"><img src="https://cdn.discordapp.com/icons/1411733652257374242/deec7fa3d9dc59fb5fa76a21fec3c6fb.webp?size=256" alt=""/>SPIDER <b>UNCOPYLOCKED</b></Link><div className="legal-top-actions"><Link href="/marketplace">Marketplace</Link><Link href="/sell" className="legal-sell">Create listing <ArrowUpRight size={14}/></Link></div></header>
  <div className="legal-layout"><aside className="legal-sidebar"><span className="legal-side-heading">INFORMATION</span>{links.map(([label,url])=><Link key={url} href={url} className={label===title?"active":""}><FileText size={15}/>{label}<ChevronRight size={13}/></Link>)}<div className="legal-side-help"><ShieldCheck size={18}/><b>Need help?</b><p>Contact the Spider support team.</p><a href="mailto:spiderstudios137483@gmail.com">Email support <ArrowUpRight size={12}/></a></div></aside>
   <article className="legal-document"><Link href="/marketplace" className="legal-back"><ArrowLeft size={14}/> Back to marketplace</Link><span className="legal-eyebrow">{eyebrow}</span><h1>{title}</h1><div className="legal-updated">Last updated {updated}</div><p className="legal-intro">{intro}</p><div className="legal-draft-note"><ShieldCheck size={16}/><span><b>Development-stage document</b><br/>This page is a working draft. Review it against the features and policies actually launched before relying on it as a final legal policy.</span></div>
   {sections.map((section,index)=><section className="legal-section" key={section.title}><div className="legal-section-number">{String(index+1).padStart(2,"0")}</div><div><h2>{section.title}</h2>{section.body.map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div></section>)}
   <div className="legal-contact-box"><div><h2>Still have questions?</h2><p>Reach out to the Spider Uncopylocked team.</p></div><a href="mailto:spiderstudios137483@gmail.com">Contact support <ArrowUpRight size={14}/></a></div>
   <footer className="legal-doc-footer"><span>© 2026 Spider Uncopylocked</span><a href="mailto:spiderstudios137483@gmail.com">spiderstudios137483@gmail.com</a></footer>
   </article>
  </div>
  <footer className="legal-bottom"><span>SPIDER UNCOPYLOCKED</span><div>{links.map(([label,url])=><Link key={url} href={url}>{label}</Link>)}</div></footer>
 </main>;
}
