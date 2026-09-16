import { NavLink, Outlet } from "react-router-dom";
import { WalletStatus } from "@/components/backfade/WalletStatus";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", key: "nav.feed" as const, end: true },
  { to: "/create", key: "nav.create" as const, end: false },
];

export function AppShell() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-19 w-full max-w-page flex-wrap items-center gap-3 px-5 py-2 sm:px-6 md:flex-nowrap md:gap-5 md:py-0">
          <NavLink
            to="/"
            className="text-narrative font-bold tracking-tight"
            aria-label={t("nav.home")}
          >
            back<span className="text-brand">fade</span>
          </NavLink>
          <nav
            className="order-3 flex w-full gap-1 rounded-panel border border-border bg-surface-1 p-1 md:order-none md:w-auto"
            aria-label={t("nav.primary")}
          >
            {links.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-11 flex-1 items-center justify-center rounded-button px-4 text-meta font-semibold transition-colors duration-standard md:flex-none",
                    isActive
                      ? "nav-link--active bg-brand/10 text-text-1"
                      : "text-text-3 hover:bg-surface-2 hover:text-text-1",
                  )
                }
              >
                {t(key)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LocaleToggle />
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
