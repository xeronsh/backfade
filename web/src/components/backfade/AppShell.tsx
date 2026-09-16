import { Activity, Plus, Radio } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { WalletStatus } from "@/components/backfade/WalletStatus";
import { Status } from "@/components/data";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Feed", icon: Radio, end: true },
  { to: "/create", label: "Create", icon: Plus, end: false },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-19 w-full max-w-page flex-wrap items-center gap-3 px-5 py-2 sm:px-6 md:flex-nowrap md:gap-5 md:py-0">
          <NavLink
            to="/"
            className="flex items-center gap-3 text-base font-bold"
            aria-label="Backfade home"
          >
            <span className="brand-mark" aria-hidden="true">
              <Activity size={15} strokeWidth={2} />
            </span>
            <span className="hidden sm:inline">
              back<span className="text-brand">fade</span>
            </span>
          </NavLink>
          <nav
            className="order-3 flex w-full gap-1 rounded-panel border border-border bg-surface-1 p-1 md:order-none md:w-auto"
            aria-label="Primary navigation"
          >
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-11 flex-1 items-center justify-center gap-2 rounded-button px-3 text-meta font-semibold transition-colors duration-standard md:flex-none",
                    isActive
                      ? "nav-link--active bg-brand/10 text-text-1"
                      : "text-text-3 hover:bg-surface-2 hover:text-text-1",
                  )
                }
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Status className="hidden lg:inline-flex" dot>
              Robinhood Testnet
            </Status>
            <WalletStatus />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
