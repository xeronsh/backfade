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
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
          <NavLink
            to="/"
            className="mr-2 text-lg font-semibold tracking-[-0.03em]"
          >
            back<span className="text-brand">fade</span>
          </NavLink>
          <nav
            className="flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-button px-3 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1",
                    isActive && "bg-surface-2 text-text-1",
                  )
                }
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="hidden items-center gap-2 text-xs text-text-3 md:flex">
            <Activity size={14} aria-hidden="true" /> Testnet
          </span>
          <div className="ml-auto">
            <WalletStatus />
          </div>
        </div>
      </header>
      <div className="border-b border-border bg-surface-1 px-5 py-2 text-center text-xs text-text-3">
        Robinhood Chain Testnet · Financial state is read from chain
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
