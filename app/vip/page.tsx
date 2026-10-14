import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import VipPurchaseFlow from "./vip-client";
import { getSpiderProfile } from "@/lib/session";
import { getVipMembership } from "@/lib/vip";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Gamepad2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "VIP Access | Spider Uncopylocked",
  description:
    "Verify the Spider Uncopylocked Roblox VIP game pass and unlock the VIP Creator Vault.",
};

export default async function VipPage() {
  const profile = await getSpiderProfile();
  const membership = await getVipMembership(profile);

  return (
    <main className="market-shell vip-page">
      <SpiderSidebar />
      <section className="market-content vip-content">
        <header className="vip-page-header">
          <div>
            <span className="spider-eyebrow">SPIDER / MEMBERSHIP</span>
            <h1>VIP Access</h1>
            <p>
              One Roblox game pass. A secure profile check. Your Spider VIP
              Creator Vault.
            </p>
          </div>
          <span className="vip-header-chip">
            <ShieldCheck size={15} /> Roblox verified access
          </span>
        </header>

        {membership ? (
          <div className="vip-member-layout">
            <section className="vip-member-hero">
              <div className="vip-member-glow" />
              <div className="vip-member-status">
                <span className="vip-status-dot" /> VIP MEMBERSHIP ACTIVE
              </div>
              <div className="vip-member-main">
                <span className="vip-member-emblem">
                  <BadgeCheck size={34} />
                </span>
                <div>
                  <h2>You're in.</h2>
                  <p>
                    @{membership.robloxUsername} is linked to your Spider
                    account. Your VIP Creator Vault is unlocked.
                  </p>
                </div>
              </div>
              <div className="vip-member-footer">
                <span>
                  <CheckCircle2 size={15} /> Ownership checked on Roblox
                </span>
                <a
                  href={
                    "https://www.roblox.com/users/" +
                    membership.robloxUserId +
                    "/profile"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View linked Roblox profile <ArrowUpRight size={14} />
                </a>
              </div>
            </section>

            <div className="vip-vault-heading">
              <div>
                <span className="spider-eyebrow">MEMBER-ONLY CONTENT</span>
                <h2>VIP Creator Vault</h2>
                <p>
                  Practical playbooks to take your next Roblox project from idea
                  to release.
                </p>
              </div>
              <span className="vip-vault-counter">03 PLAYBOOKS</span>
            </div>

            <div className="vip-playbook-grid">
              <article className="vip-playbook-card">
                <span className="vip-playbook-icon">
                  <Gamepad2 size={20} />
                </span>
                <span className="vip-playbook-index">PLAYBOOK 01</span>
                <h3>Game launch checklist</h3>
                <p>
                  Validate your core loop, progression, save data, performance,
                  and launch readiness before pushing an update.
                </p>
                <ul>
                  <li>Test fresh-player and returning-player flows.</li>
                  <li>Verify saving, loading, and reconnect behavior.</li>
                  <li>Check mobile controls, UI scale, and performance.</li>
                  <li>Plan moderation, rollback, and launch-day monitoring.</li>
                </ul>
              </article>
              <article className="vip-playbook-card">
                <span className="vip-playbook-icon">
                  <ClipboardCheck size={20} />
                </span>
                <span className="vip-playbook-index">PLAYBOOK 02</span>
                <h3>Asset handoff checklist</h3>
                <p>
                  Keep a project handoff organized so the next developer can
                  pick it up without guesswork.
                </p>
                <ul>
                  <li>
                    Use clear folder names and a readable project structure.
                  </li>
                  <li>Document dependencies, scripts, and configuration.</li>
                  <li>List known bugs and any unfinished systems.</li>
                  <li>Confirm asset permissions before distributing files.</li>
                </ul>
              </article>
              <article className="vip-playbook-card">
                <span className="vip-playbook-icon">
                  <BookOpenCheck size={20} />
                </span>
                <span className="vip-playbook-index">PLAYBOOK 03</span>
                <h3>Release readiness</h3>
                <p>
                  A simple pass before release to reduce avoidable issues and
                  give players a clean first session.
                </p>
                <ul>
                  <li>
                    Run a test pass with people who did not build the game.
                  </li>
                  <li>
                    Check thumbnails, descriptions, icons, and loading screens.
                  </li>
                  <li>Review analytics and expected peak-player traffic.</li>
                  <li>Write patch notes and a clear player support path.</li>
                </ul>
              </article>
            </div>

            <section className="vip-member-tools">
              <div className="vip-member-tools-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <h3>Keep building</h3>
                <p>
                  Use Spider's existing resource library and creator directory
                  alongside your member playbooks.
                </p>
              </div>
              <div className="vip-member-tool-links">
                <Link href="/resources">
                  Explore resources <ArrowUpRight size={14} />
                </Link>
                <Link href="/developers">
                  Find developers <ArrowUpRight size={14} />
                </Link>
              </div>
            </section>
            <p className="vip-membership-note">
              Verified for @{membership.robloxUsername}. VIP access is securely
              saved in this browser for 30 days. On a new browser or after it
              expires, verify the same Roblox account again; your game pass
              purchase is not charged again.
            </p>
          </div>
        ) : (
          <>
            <div className="vip-overview-strip">
              <div>
                <span className="vip-overview-icon">
                  <ShieldCheck size={18} />
                </span>
                <span>
                  <strong>Actual ownership check</strong>
                  <small>
                    We query Roblox; a code alone does not grant membership.
                  </small>
                </span>
              </div>
              <div>
                <span className="vip-overview-icon">
                  <LockKeyhole size={18} />
                </span>
                <span>
                  <strong>Bound to your Spider account</strong>
                  <small>
                    The verification is tied to the Discord account you're
                    signed into.
                  </small>
                </span>
              </div>
              <div>
                <span className="vip-overview-icon">
                  <Sparkles size={18} />
                </span>
                <span>
                  <strong>Member-only Creator Vault</strong>
                  <small>
                    Unlock three project playbooks after verification.
                  </small>
                </span>
              </div>
            </div>
            <VipPurchaseFlow signedIn={!!profile} />
          </>
        )}
      </section>
    </main>
  );
}
