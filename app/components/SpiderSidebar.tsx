"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Home,
  Ticket,
  ClipboardList,
  Search,
  BriefcaseBusiness,
  Settings,
  UploadCloud,
  Users,
  UserRoundPlus,
  ShieldCheck,
  LibraryBig,
  UsersRound,
  Building2,
  MessagesSquare,
  Sparkles,
  ShoppingBag,
  LogOut,
  LockKeyhole,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogIn,
} from "lucide-react";

const ADMIN_DISCORD_ID = "1337293227820322878";

type NavigationItem = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const workspace: NavigationItem[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/messages", label: "Messages", Icon: MessagesSquare },
];
const discover: NavigationItem[] = [
  { href: "/store", label: "Creator Store", Icon: ShoppingBag },
  { href: "/resources", label: "Resources", Icon: LibraryBig },
  { href: "/marketplace", label: "Game Marketplace", Icon: Users },
  { href: "/developers", label: "Hire Developers", Icon: Search },
  { href: "/studios", label: "Studios", Icon: Building2 },
  { href: "/vip", label: "VIP Access", Icon: ShieldCheck },
  { href: "/pro", label: "Spider Pro", Icon: Sparkles },
  { href: "/team", label: "Meet the Team", Icon: UsersRound },
];
const work: NavigationItem[] = [
  { href: "/commissions", label: "Commissions", Icon: BriefcaseBusiness },
  { href: "/jobs", label: "Jobs", Icon: BriefcaseBusiness },
  { href: "/post-job", label: "Post a Job", Icon: UploadCloud },
];
const creatorTools: NavigationItem[] = [
  { href: "/resources/my", label: "My Uploads", Icon: LibraryBig },
  {
    href: "/become-developer",
    label: "Become a Developer",
    Icon: UserRoundPlus,
  },
  { href: "/match", label: "Developer Match", Icon: Sparkles },
  { href: "/spider-ai", label: "Spider AI", Icon: Sparkles },
];
const safety: NavigationItem[] = [
  { href: "/report-scam", label: "Report a Scam", Icon: ShieldCheck },
  { href: "/guidelines", label: "Safety & FAQ", Icon: ShieldCheck },
];

function SidebarGroup({
  label,
  items,
  path,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: NavigationItem[];
  path: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="sidebar-group">
      <span className="sidebar-section-label">{label}</span>
      <nav aria-label={label}>
        {items.map(({ href, label: itemLabel, Icon }) => {
          const active =
            path === href || (href !== "/" && path.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? itemLabel : undefined}
              aria-current={active ? "page" : undefined}
              className={active ? "active" : ""}
              onClick={onNavigate}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="sidebar-link-label">{itemLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function SpiderSidebar() {
  const path = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("spider-sidebar-collapsed") === "true");
    } catch {
      setCollapsed(false);
    }
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setUser(data.user || null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.spiderSidebarCollapsed = collapsed
      ? "true"
      : "false";
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("spider-sidebar-collapsed", String(next));
      } catch {
        // The collapse interaction still works when storage is unavailable.
      }
      return next;
    });
  }, []);

  const userName = user?.displayName || user?.username || "Discord account";
  const userAvatar = user?.avatar || "/spider-uncopylocked-pfp.webp";

  return (
    <>
      <button
        className="sidebar-mobile-trigger"
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="spider-main-sidebar"
      >
        <Menu size={19} />
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobile}
        />
      )}
      <aside
        id="spider-main-sidebar"
        className={[
          "spider-sidebar",
          collapsed ? "is-collapsed" : "",
          mobileOpen ? "is-mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Spider Uncopylocked navigation"
      >
        <div className="sidebar-head">
          <Link
            href="/"
            className="sidebar-brand"
            aria-label="Spider Uncopylocked home"
            onClick={closeMobile}
          >
            <img src="/spider-uncopylocked-pfp.webp" alt="" />
            <span className="sidebar-brand-copy">
              SPIDER<small>UNCOPYLOCKED</small>
            </span>
          </Link>
          <button
            className="sidebar-collapse"
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
          <button
            className="sidebar-mobile-close"
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-scroll-area">
          {user ? (
            <div className="sidebar-user" title={userName}>
              <img
                src={userAvatar}
                alt=""
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/spider-uncopylocked-pfp.webp";
                }}
              />
              <span className="sidebar-user-copy">
                <b>{userName}</b>
                <small>@{user.username || "Discord connected"}</small>
              </span>
              <span
                className="sidebar-user-status"
                aria-label="Discord connected"
                title="Discord connected"
              />
            </div>
          ) : (
            <Link
              href="/api/auth/discord/login"
              className="sidebar-account-cta"
              onClick={closeMobile}
            >
              <LogIn size={16} />
              <span className="sidebar-link-label">Sign in with Discord</span>
            </Link>
          )}

          <SidebarGroup
            label="WORKSPACE"
            items={workspace}
            path={path}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <SidebarGroup
            label="DISCOVER"
            items={discover}
            path={path}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <SidebarGroup
            label="BUSINESS"
            items={work}
            path={path}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <SidebarGroup
            label="CREATOR TOOLS"
            items={creatorTools}
            path={path}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <SidebarGroup
            label="SAFETY"
            items={safety}
            path={path}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
        </div>

        <div className="sidebar-bottom">
          <Link
            href="/support"
            className={path === "/support" || path.startsWith("/support/") ? "active" : ""}
            onClick={closeMobile}
            title={collapsed ? "Support Center / Tickets" : undefined}
          >
            <Ticket size={16} />
            <span className="sidebar-link-label">Support Center / Tickets</span>
          </Link>
          {user?.id === ADMIN_DISCORD_ID && (
            <>
              <Link
                href="/admin"
                className={
                  path === "/admin" || path.startsWith("/admin/")
                    ? "active"
                    : ""
                }
                onClick={closeMobile}
                title={collapsed ? "Admin Panel" : undefined}
              >
                <LockKeyhole size={16} />
                <span className="sidebar-link-label">Admin Panel</span>
              </Link>
              <Link
                href="/admin/billing"
                className={path === "/admin/billing" ? "active" : ""}
                onClick={closeMobile}
                title={collapsed ? "Billing Overview" : undefined}
              >
                <CreditCard size={16} />
                <span className="sidebar-link-label">Billing Overview</span>
              </Link>
            </>
          )}
          <Link
            href="/dashboard/settings?tab=billing"
            className={path === "/dashboard/settings" ? "active" : ""}
            onClick={closeMobile}
            title={collapsed ? "Billing" : undefined}
          >
            <CreditCard size={16} />
            <span className="sidebar-link-label">Billing</span>
          </Link>
          <Link
            href="/settings"
            className={path === "/settings" ? "active" : ""}
            onClick={closeMobile}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={16} />
            <span className="sidebar-link-label">Settings</span>
          </Link>
          {user && (
            <div className="sidebar-user-footer">
              <span className="sidebar-user-footer-label">DISCORD</span>
              <Link
                href="/api/auth/logout"
                onClick={closeMobile}
                className="sidebar-signout"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={14} />
                <span className="sidebar-link-label">Sign out</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
