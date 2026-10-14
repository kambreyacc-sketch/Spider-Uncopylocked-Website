import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Blocks,
  Building2,
  CirclePlus,
  Code2,
  Gamepad2,
  Hammer,
  Palette,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Studios | Spider Uncopylocked",
  description: "Manage your Roblox studio workspace, teams, and projects.",
};

const starterRoles = [
  { label: "Scripters", icon: Code2 },
  { label: "Builders", icon: Hammer },
  { label: "UI & GFX artists", icon: Palette },
];

export default function StudiosPage() {
  return (
    <main className="market-shell studios-page">
      <SpiderSidebar />
      <section className="market-content studios-content">
        <header className="studios-page-header">
          <div>
            <span className="spider-eyebrow">SPIDER / WORKSPACE</span>
            <h1>Studios</h1>
            <p>
              Manage your studio space, bring your team together, and organize
              the games you build.
            </p>
          </div>
          <Link
            href="/studios/create"
            className="hire-primary studios-create-button"
          >
            <CirclePlus size={16} /> Create a studio
          </Link>
        </header>

        <div className="studios-toolbar">
          <nav
            className="studios-view-tabs"
            aria-label="Studio workspace views"
          >
            <a href="#my-studios" className="studios-view-tab active">
              My studios
            </a>
            <a href="#studio-guide" className="studios-view-tab">
              Getting started
            </a>
          </nav>
          <Link href="/developers" className="studios-quiet-link">
            Explore developers <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="studios-dashboard-grid">
          <section className="studios-main-column">
            <div id="my-studios" className="studios-panel studios-owned-panel">
              <div className="studios-panel-heading">
                <div>
                  <h2>Your studios</h2>
                  <p>Studios you own or are a member of will be shown here.</p>
                </div>
                <span className="studios-panel-count">
                  <Building2 size={14} /> Studio workspace
                </span>
              </div>

              <div className="studios-empty-state">
                <span className="studios-empty-icon">
                  <Building2 size={26} />
                </span>
                <h3>No studio records yet</h3>
                <p>
                  Studio publishing and membership records are not connected to
                  the live database yet. You can prepare a studio profile, but
                  it will not appear as a published studio until that connection
                  is enabled.
                </p>
                <Link href="/studios/create" className="hire-primary">
                  <CirclePlus size={15} /> Start a studio profile
                </Link>
              </div>
            </div>

            <div className="studios-panel studios-team-panel">
              <div className="studios-panel-heading">
                <div>
                  <h2>Build your team</h2>
                  <p>
                    Find the skills you need before your next project starts.
                  </p>
                </div>
                <Link href="/developers" className="studios-inline-link">
                  Browse all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="studios-role-grid">
                {starterRoles.map(({ label, icon: Icon }) => (
                  <Link
                    href="/developers"
                    key={label}
                    className="studios-role-card"
                  >
                    <span>
                      <Icon size={18} />
                    </span>
                    <strong>{label}</strong>
                    <ArrowUpRight size={14} className="studios-role-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <aside id="studio-guide" className="studios-side-column">
            <section className="studios-panel studios-guide-panel">
              <span className="studios-guide-icon">
                <Blocks size={18} />
              </span>
              <h2>Set up your workspace</h2>
              <p>
                A studio profile gives your team one place to present its
                identity and the projects it works on.
              </p>
              <ol className="studios-steps">
                <li>
                  <span>01</span>
                  <div>
                    <strong>Create your profile</strong>
                    <small>
                      Add a name, description, specialties, and branding.
                    </small>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Gather your team</strong>
                    <small>
                      Find developers and agree on responsibilities.
                    </small>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Showcase your games</strong>
                    <small>
                      Connect real projects when studio publishing is available.
                    </small>
                  </div>
                </li>
              </ol>
              <Link href="/studios/create" className="studios-guide-cta">
                Create studio profile <ArrowRight size={15} />
              </Link>
            </section>

            <section className="studios-panel studios-tip-panel">
              <span className="studios-tip-icon">
                <BadgeCheck size={17} />
              </span>
              <div>
                <h3>Keep it authentic</h3>
                <p>
                  Use real project thumbnails and list the people who actually
                  work with your studio.
                </p>
              </div>
            </section>
            <section className="studios-project-prompt">
              <Gamepad2 size={18} />
              <div>
                <strong>Working on a game already?</strong>
                <small>
                  Browse real resources to help move your project forward.
                </small>
              </div>
              <Link href="/resources" aria-label="Browse resources">
                <ArrowUpRight size={16} />
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
