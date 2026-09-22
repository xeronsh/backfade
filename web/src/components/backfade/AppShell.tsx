import { NavLink, Outlet } from "react-router-dom";
import { useAccount } from "wagmi";
import { WalletStatus } from "@/components/backfade/WalletStatus";
import { ButtonLink } from "@/components/ui/button-link";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Desktop is a three-column product: a fixed left rail, the page body, and the
 * page's own aside. The rail is `fixed` so `PageContainer` stays the single
 * owner of page width and gutters — the body just shifts right to clear it.
 */
export function AppShell() {
  const { t } = useLocale();
  const { address } = useAccount();

  // The profile route only makes sense once there is an address to point at,
  // so it appears with the wallet rather than as a dead link before connecting.
  const links = [
    { to: "/", key: "nav.feed" as const, end: true },
    { to: "/post", key: "nav.create" as const, end: false },
    { to: "/leaderboard", key: "nav.leaderboard" as const, end: false },
    ...(address
      ? [{ to: `/profile/${address}`, key: "nav.profile" as const, end: false }]
      : []),
  ];

  // The rail carries Post a Thesis as its primary CTA, so the rail navigation
  // lists destinations only; the mobile tab bar still needs it inline.
  const railLinks = links.filter((link) => link.key !== "nav.create");

  return (
    <div className="min-h-screen bg-canvas">
      <aside
        data-slot="rail"
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-canvas px-4 py-6 lg:flex"
      >
        <NavLink
          to="/"
          className="px-3 text-narrative font-bold tracking-tight"
          aria-label={t("nav.home")}
        >
          back<span className="text-brand">fade</span>
        </NavLink>
        <nav className="mt-8 grid gap-1" aria-label={t("nav.primary")}>
          {railLinks.map(({ to, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "nav-link--rail relative flex min-h-11 items-center rounded-button px-3 text-body font-semibold transition-colors duration-standard",
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
        <div className="mt-6 px-3">
          <ButtonLink to="/post" variant="primary" className="w-full">
            {t("nav.create")}
          </ButtonLink>        </div>
        <div className="mt-auto grid gap-3 px-3 pt-6">
          <LocaleToggle />
          <WalletStatus className="w-full" />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-xl lg:hidden">
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

      <div className="lg:pl-60">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
