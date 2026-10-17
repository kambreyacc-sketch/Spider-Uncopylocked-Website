"use client";

import SpiderSidebar from "../components/SpiderSidebar";
import BillingSettingsClient from "../dashboard/settings/billing-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  LockKeyhole,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type Preferences = {
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  compactCards: boolean;
  showActivity: boolean;
  notifications: {
    messages: boolean;
    jobs: boolean;
    commissions: boolean;
    studios: boolean;
    account: boolean;
  };
};

type AccountUser = {
  username?: string;
  global_name?: string;
  name?: string;
  id?: string;
  avatarUrl?: string;
  avatar_url?: string;
  avatar?: string;
};

const STORAGE_KEY = "spider-account-preferences";
const DEFAULTS: Preferences = {
  density: "comfortable",
  reduceMotion: false,
  compactCards: false,
  showActivity: true,
  notifications: {
    messages: true,
    jobs: true,
    commissions: true,
    studios: true,
    account: true,
  },
};

const settingSections = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: MonitorCog },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
];

function PreferenceSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="settings-preference-row">
      <span className="settings-preference-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        className="settings-switch"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
    </label>
  );
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = JSON.parse(raw);
        setPreferences({
          ...DEFAULTS,
          ...restored,
          density: restored.density === "compact" ? "compact" : "comfortable",
          notifications: {
            ...DEFAULTS.notifications,
            ...(restored.notifications || {}),
          },
        });
      }
    } catch {
      // Ignore corrupted browser preferences and keep defaults.
    }
    setLoaded(true);

    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setAccount(data.user || null);
      })
      .catch(() => {
        if (active) setAccount(null);
      })
      .finally(() => {
        if (active) setAccountChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.dataset.compactCards = preferences.compactCards
      ? "true"
      : "false";
    document.documentElement.dataset.showActivity = preferences.showActivity
      ? "true"
      : "false";
    document.documentElement.dataset.reduceMotion = preferences.reduceMotion
      ? "true"
      : "false";
  }, [preferences, loaded]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updateNotification(
    key: keyof Preferences["notifications"],
    value: boolean,
  ) {
    setPreferences((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
    setSaved(false);
  }

  function savePreferences() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      document.documentElement.dataset.density = preferences.density;
      document.documentElement.dataset.compactCards = preferences.compactCards
        ? "true"
        : "false";
      document.documentElement.dataset.showActivity = preferences.showActivity
        ? "true"
        : "false";
      document.documentElement.dataset.reduceMotion = preferences.reduceMotion
        ? "true"
        : "false";
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function resetPreferences() {
    setPreferences(DEFAULTS);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
      document.documentElement.dataset.density = DEFAULTS.density;
      document.documentElement.dataset.reduceMotion = "false";
      document.documentElement.dataset.compactCards = "false";
      document.documentElement.dataset.showActivity = "true";
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  const displayName =
    account?.global_name ||
    account?.username ||
    account?.name ||
    "Discord account";
  const avatar =
    account?.avatarUrl ||
    account?.avatar_url ||
    account?.avatar ||
    "/spider-uncopylocked-pfp.webp";

  return (
    <main className="market-shell settings-page">
      <SpiderSidebar />
      <section className="market-content settings-content">
        <header className="settings-page-header">
          <div>
            <span className="spider-eyebrow">SPIDER / WORKSPACE</span>
            <h1>Settings</h1>
            <p>
              Make your workspace feel right. Your choices stay under your
              control.
            </p>
          </div>
          <div className="settings-header-actions">
            <button
              type="button"
              className="settings-reset-button"
              onClick={resetPreferences}
            >
              Reset preferences
            </button>
            <button
              type="button"
              className="hire-primary settings-save-button"
              onClick={savePreferences}
              disabled={!loaded}
            >
              <Check size={16} /> Save changes
            </button>
          </div>
        </header>

        <div className="settings-workspace">
          <nav className="settings-subnav" aria-label="Settings sections">
            <span className="settings-subnav-label">YOUR WORKSPACE</span>
            {settingSections.map(({ id, label, icon: Icon }) => (
              <a key={id} href={"#" + id} className="settings-subnav-link">
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={14} className="settings-subnav-chevron" />
              </a>
            ))}
            <div className="settings-subnav-divider" />
            <a href="#billing" className="settings-subnav-link">
              <CreditCard size={16} />
              <span>Billing</span>
              <ChevronRight size={14} className="settings-subnav-chevron" />
            </a>
            <a href="#help" className="settings-subnav-link">
              <CircleHelp size={16} />
              <span>Help & support</span>
              <ChevronRight size={14} className="settings-subnav-chevron" />
            </a>
            <div className="settings-subnav-note">
              <Sparkles size={15} />
              <span>
                Glossy graphite is the standard Spider look, so your workspace
                stays visually consistent.
              </span>
            </div>
          </nav>

          <div className="settings-sections">
            <section id="account" className="settings-section-card">
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <UserRound size={18} />
                </span>
                <div>
                  <h2>Account</h2>
                  <p>Your signed-in identity and billing shortcuts.</p>
                </div>
              </div>
              <div className="settings-account-row">
                <img
                  src={avatar}
                  alt=""
                  className="settings-account-avatar"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/spider-uncopylocked-pfp.webp";
                  }}
                />
                <div className="settings-account-identity">
                  <strong>
                    {accountChecked ? displayName : "Checking account…"}
                  </strong>
                  <small>
                    {account
                      ? "Connected through Discord"
                      : accountChecked
                        ? "You are not signed in"
                        : "Checking Discord session"}
                  </small>
                </div>
                {account ? (
                  <span className="settings-connection-state">
                    <span /> Connected
                  </span>
                ) : (
                  <Link
                    href="/api/auth/discord/login"
                    className="settings-inline-action"
                  >
                    Connect Discord <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </section>

            <section id="billing" className="settings-section-card">
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <CreditCard size={18} />
                </span>
                <div>
                  <h2>Billing & subscriptions</h2>
                  <p>Manage your plan, payment methods, renewals, and receipts here in Settings.</p>
                </div>
              </div>
              {account ? (
                <BillingSettingsClient
                  user={{
                    id: account.id || "",
                    displayName,
                    avatar,
                  }}
                />
              ) : (
                <div className="settings-link-row">
                  <div className="settings-link-copy">
                    <CreditCard size={17} />
                    <span>
                      <strong>Connect your account to manage billing</strong>
                      <small>Your billing details are linked to your signed-in Discord account.</small>
                    </span>
                  </div>
                  <Link href="/api/auth/discord/login" className="settings-inline-action">
                    Sign in with Discord <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            <section id="appearance" className="settings-section-card">
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <MonitorCog size={18} />
                </span>
                <div>
                  <h2>Appearance & layout</h2>
                  <p>Adjust how much space the interface gives your content.</p>
                </div>
              </div>
              <div className="settings-field-row">
                <div className="settings-field-copy">
                  <strong>Content density</strong>
                  <small>
                    Comfortable gives cards and rows more breathing room.
                    Compact fits more items on screen.
                  </small>
                </div>
                <select
                  className="settings-select"
                  value={preferences.density}
                  onChange={(event) =>
                    update(
                      "density",
                      event.target.value as Preferences["density"],
                    )
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              <PreferenceSwitch
                checked={preferences.reduceMotion}
                onChange={(value) => update("reduceMotion", value)}
                label="Reduce motion"
                description="Use fewer transitions and animations throughout the interface."
              />
              <PreferenceSwitch
                checked={preferences.compactCards}
                onChange={(value) => update("compactCards", value)}
                label="Compact marketplace cards"
                description="Affects supported resource and game-card layouts."
              />
            </section>

            <section id="notifications" className="settings-section-card">
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <Bell size={18} />
                </span>
                <div>
                  <h2>Notifications</h2>
                  <p>
                    Choose the types of updates you want to keep visible in your
                    preferences.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                checked={preferences.notifications.messages}
                onChange={(value) => updateNotification("messages", value)}
                label="Messages"
                description="New replies and collaboration messages."
              />
              <PreferenceSwitch
                checked={preferences.notifications.jobs}
                onChange={(value) => updateNotification("jobs", value)}
                label="Jobs & applications"
                description="Hiring updates, applications, and matching opportunities."
              />
              <PreferenceSwitch
                checked={preferences.notifications.commissions}
                onChange={(value) => updateNotification("commissions", value)}
                label="Commissions"
                description="Commission requests and project status updates."
              />
              <PreferenceSwitch
                checked={preferences.notifications.studios}
                onChange={(value) => updateNotification("studios", value)}
                label="Studios & teams"
                description="Studio invitations and team activity."
              />
              <PreferenceSwitch
                checked={preferences.notifications.account}
                onChange={(value) => updateNotification("account", value)}
                label="Account updates"
                description="Important account and product notices."
              />
              <p className="settings-honesty-note">
                <Bell size={14} /> These preferences are saved on this device.
                Server-delivered notifications are not connected to these
                switches yet.
              </p>
            </section>

            <section id="privacy" className="settings-section-card">
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h2>Privacy & activity</h2>
                  <p>Control optional interface details on this device.</p>
                </div>
              </div>
              <PreferenceSwitch
                checked={preferences.showActivity}
                onChange={(value) => update("showActivity", value)}
                label="Show activity indicators"
                description="Display activity indicators in supported places when that information is available."
              />
              <div className="settings-link-row settings-help-row" id="help">
                <div className="settings-link-copy">
                  <LockKeyhole size={17} />
                  <span>
                    <strong>Privacy & platform guidelines</strong>
                    <small>
                      Review how to use the platform safely and report concerns.
                    </small>
                  </span>
                </div>
                <Link href="/privacy" className="settings-inline-action">
                  View privacy <ChevronRight size={14} />
                </Link>
              </div>
            </section>

            <div className="settings-save-footer" role="status">
              <span>
                {saved
                  ? "Your preferences have been saved on this device."
                  : "Remember to save when you are finished."}
              </span>
              <button
                type="button"
                className="hire-primary settings-save-button"
                onClick={savePreferences}
                disabled={!loaded}
              >
                <Check size={16} /> {saved ? "Saved" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
