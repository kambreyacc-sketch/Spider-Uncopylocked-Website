"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Settings as SettingsIcon } from "lucide-react";

type Preferences = {
  theme: "system" | "light" | "dark";
  compactCards: boolean;
  showActivity: boolean;
};

const defaults: Preferences = { theme: "system", compactCards: false, showActivity: true };
const storageKey = "spider-account-preferences";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        setPreferences({
          theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
          compactCards: parsed.compactCards === true,
          showActivity: parsed.showActivity !== false,
        });
      }
    } catch {
      // Keep defaults if saved browser preferences cannot be read.
    }
    setLoaded(true);
  }, []);

  function savePreferences() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#101014", color: "#f7f5ff", padding: "36px 20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/marketplace" style={{ color: "#c5b6ff", display: "inline-flex", gap: 8, alignItems: "center", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to marketplace
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32 }}>
          <SettingsIcon size={26} color="#a78bfa" />
          <div>
            <p style={{ color: "#a78bfa", fontSize: 11, letterSpacing: 2, margin: 0 }}>YOUR ACCOUNT</p>
            <h1 style={{ fontSize: 32, margin: "7px 0 0" }}>Settings</h1>
          </div>
        </div>
        <p style={{ color: "#aaa7b6", lineHeight: 1.6 }}>Manage your marketplace preferences. Changes are saved in this browser and remain after you sign in again on this device.</p>
        <section style={{ border: "1px solid #34313f", borderRadius: 16, padding: 22, marginTop: 26, background: "#17161d" }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Appearance</h2>
          <label htmlFor="theme" style={{ display: "block", color: "#c9c5d4", marginBottom: 9 }}>Color preference</label>
          <select id="theme" disabled={!loaded} value={preferences.theme} onChange={e => setPreferences(p => ({ ...p, theme: e.target.value as Preferences["theme"] }))} style={{ width: "100%", padding: 12, borderRadius: 9, color: "#f7f5ff", background: "#23212c", border: "1px solid #464052" }}>
            <option value="system">Use device preference</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <h2 style={{ fontSize: 18, marginTop: 26 }}>Marketplace</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "#d8d4e1" }}>
            <input type="checkbox" checked={preferences.compactCards} disabled={!loaded} onChange={e => setPreferences(p => ({ ...p, compactCards: e.target.checked }))} />
            Use compact listing cards
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "#d8d4e1" }}>
            <input type="checkbox" checked={preferences.showActivity} disabled={!loaded} onChange={e => setPreferences(p => ({ ...p, showActivity: e.target.checked }))} />
            Show activity indicators when available
          </label>
          <button onClick={savePreferences} disabled={!loaded} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "12px 18px", border: 0, borderRadius: 9, background: "#8b6cff", color: "white", fontWeight: 700, cursor: "pointer" }}>
            <Check size={16} /> Save settings
          </button>
          {saved && <p role="status" style={{ color: "#a7f3d0", marginBottom: 0 }}>Settings saved on this device.</p>}
        </section>
        <p style={{ color: "#888493", fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>These are browser-level preferences, not account-wide settings. They do not change your Discord profile or save across different devices yet.</p>
      </div>
    </main>
  );
}
