import { Activity, Plus, Radio } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { WalletStatus } from "@/components/backfade/WalletStatus";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Feed", icon: Radio, end: true },
  { to: "/create", label: "Create", icon: Plus, end: false },
];

export function AppShell() {
  return (
    <div className="app-shell min-h-screen bg-canvas">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand-lockup" aria-label="Backfade home">
            <span className="brand-mark" aria-hidden="true">
              <Activity size={15} strokeWidth={2} />
            </span>
            <span className="brand-wordmark">
              back<span>fade</span>
            </span>
          </NavLink>
          <nav className="nav-pill" aria-label="Primary navigation">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn("nav-link", isActive && "nav-link--active")
                }
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="network-chip">
            <Activity size={13} aria-hidden="true" />
            Robinhood Testnet
          </div>
          <WalletStatus />
        </div>
      </header>
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
