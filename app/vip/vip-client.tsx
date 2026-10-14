"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
const VIP_GAME_PASS_URL =
  "https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED";

type Challenge = {
  code: string;
  username: string;
  displayName: string;
  robloxUserId: string;
  profileUrl: string;
  expiresAt: number;
};

export default function VipPurchaseFlow({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState<"generate" | "verify" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  async function generateCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("generate");
    setError("");
    setNotice("");
    setChallenge(null);
    setCopied(false);
    try {
      const response = await fetch("/api/vip/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ username }),
      });
      const result = (await response.json()) as Challenge & {
        error?: string;
        code?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error || "Couldn't generate a verification code.",
        );
      setChallenge({
        code: result.code || "",
        username: result.username,
        displayName: result.displayName,
        robloxUserId: result.robloxUserId,
        profileUrl: result.profileUrl,
        expiresAt: result.expiresAt,
      });
      setNotice(
        "Code created. Add it to the About section on your Roblox profile, then verify below.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function confirmVip() {
    setBusy("verify");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/vip/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as {
        error?: string;
        vipActive?: boolean;
      };
      if (!response.ok)
        throw new Error(
          result.error || "Verification didn't complete. Please retry.",
        );
      setNotice("VIP is verified. Opening your member area…");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function copyCode() {
    if (!challenge?.code) return;
    try {
      await navigator.clipboard.writeText(challenge.code);
      setCopied(true);
      setNotice(
        "Verification code copied. Paste it into your Roblox About section.",
      );
    } catch {
      setError(
        "Copy wasn't available here. Select the code above and copy it manually.",
      );
    }
  }

  return (
    <div className="vip-purchase-layout">
      <section className="vip-offer-card">
        <div className="vip-offer-topline">
          <span className="vip-pass-icon">
            <ShieldCheck size={20} />
          </span>
          <span className="vip-product-label">SPIDER / VIP MEMBERSHIP</span>
          <span className="vip-one-time-label">ROBLOX GAME PASS</span>
        </div>
        <div className="vip-offer-copy">
          <h2>Unlock Spider VIP</h2>
          <p>
            Buy the official Spider Uncopylocked VIP pass on Roblox, then link
            it to your Spider account with a short public-profile check.
          </p>
        </div>
        <div className="vip-offer-benefits">
          <div>
            <CheckCircle2 size={16} />
            <span>Access to the VIP Creator Vault</span>
          </div>
          <div>
            <CheckCircle2 size={16} />
            <span>Member-only launch and asset playbooks</span>
          </div>
          <div>
            <CheckCircle2 size={16} />
            <span>Secure account-bound VIP access</span>
          </div>
        </div>
        <a
          href={VIP_GAME_PASS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="vip-buy-button"
        >
          Buy VIP on Roblox <ExternalLink size={16} />
        </a>
        <p className="vip-price-note">
          Roblox handles the purchase and displays the current Robux price.
          Spider won't unlock VIP until Roblox ownership is confirmed.
        </p>
        <div className="vip-trust-strip">
          <LockKeyhole size={15} />
          <span>
            Your purchase is checked server-side. The profile code alone cannot
            unlock VIP.
          </span>
        </div>
      </section>

      <section className="vip-activation-card">
        <div className="vip-activation-heading">
          <div>
            <span className="spider-eyebrow">ACTIVATE MEMBERSHIP</span>
            <h2>Confirm your VIP pass</h2>
            <p>Buy first, then complete the profile check below.</p>
          </div>
          <span className="vip-activation-mark">
            <Sparkles size={18} />
          </span>
        </div>

        {!signedIn ? (
          <div className="vip-signin-required">
            <span className="vip-step-number">
              <UserRound size={16} />
            </span>
            <h3>Sign in to your Spider account</h3>
            <p>
              VIP is attached to your signed-in Spider account, so your
              membership can't be claimed by another account.
            </p>
            <Link
              href="/api/auth/discord/login?next=%2Fvip"
              className="vip-secondary-button"
            >
              Sign in with Discord <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <ol className="vip-step-list">
              <li className="vip-step">
                <span className="vip-step-number">1</span>
                <div>
                  <strong>Buy the game pass</strong>
                  <small>
                    Open Roblox from the button on this page. When checkout
                    finishes, return here.
                  </small>
                </div>
                <a
                  href={VIP_GAME_PASS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vip-mini-link"
                  aria-label="Open Roblox game pass"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
              <li className="vip-step">
                <span className="vip-step-number">2</span>
                <div>
                  <strong>Generate your code</strong>
                  <small>
                    Enter the Roblox username that bought the pass. We'll look
                    up that public profile.
                  </small>
                </div>
              </li>
              <li className="vip-step">
                <span className="vip-step-number">3</span>
                <div>
                  <strong>Add it to your Roblox About section</strong>
                  <small>
                    This proves you control the account. Remove the code later
                    if you like.
                  </small>
                </div>
              </li>
              <li className="vip-step">
                <span className="vip-step-number">4</span>
                <div>
                  <strong>Verify ownership</strong>
                  <small>
                    We'll check the profile code and the game-pass ownership
                    separately.
                  </small>
                </div>
              </li>
            </ol>

            {!challenge ? (
              <form className="vip-username-form" onSubmit={generateCode}>
                <label htmlFor="vip-roblox-username">Roblox username</label>
                <div className="vip-input-row">
                  <input
                    id="vip-roblox-username"
                    name="username"
                    autoComplete="off"
                    spellCheck={false}
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]{3,20}"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter the account that owns the pass"
                  />
                  <button
                    type="submit"
                    className="vip-secondary-button"
                    disabled={busy !== null}
                  >
                    {busy === "generate" ? "Checking…" : "Generate code"}
                  </button>
                </div>
                <small className="vip-form-help">
                  The code expires in 20 minutes. Make sure you enter the
                  account that purchased the pass.
                </small>
              </form>
            ) : (
              <div className="vip-code-panel">
                <div className="vip-code-heading">
                  <div>
                    <strong>Your profile code</strong>
                    <small>
                      Expires{" "}
                      {new Date(challenge.expiresAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <span className="vip-code-countdown">
                    <Clock3 size={13} /> 20 min
                  </span>
                </div>
                <div className="vip-code-box">
                  <code>{challenge.code}</code>
                  <button
                    type="button"
                    onClick={copyCode}
                    aria-label="Copy verification code"
                  >
                    <Clipboard size={15} /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p>
                  Open @{challenge.username}'s Roblox profile, edit the public
                  About / Description field, paste the code as a separate line,
                  and save it.
                </p>
                <a
                  href={challenge.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vip-secondary-button vip-profile-button"
                >
                  Open Roblox profile <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  className="vip-buy-button vip-verify-button"
                  onClick={confirmVip}
                  disabled={busy !== null}
                >
                  {busy === "verify"
                    ? "Checking profile and pass…"
                    : "Verify profile & unlock VIP"}
                  {busy === "verify" ? (
                    <span className="vip-spinner" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
                <button
                  type="button"
                  className="vip-back-link"
                  onClick={() => {
                    setChallenge(null);
                    setNotice("");
                    setError("");
                    setCopied(false);
                  }}
                >
                  Use a different Roblox username
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="vip-feedback vip-feedback-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="vip-feedback vip-feedback-success" role="status">
            {notice}
          </p>
        )}
        <p className="vip-security-footnote">
          The verification code is temporary. Spider checks the Roblox public
          profile and the actual game-pass ownership before granting access.
        </p>
      </section>
    </div>
  );
}
