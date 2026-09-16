import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/backfade/AppShell";
import CreateThesis from "@/routes/CreateThesis";
import Feed from "@/routes/Feed";
import MarketDetail from "@/routes/MarketDetail";
import Profile from "@/routes/Profile";

/**
 * A client-side navigation should not look like a page load. The routes are
 * imported eagerly: together they are a fraction of the wallet SDK the shell
 * already ships, and splitting them out meant every first visit to a route
 * swapped the page for a skeleton while its chunk downloaded.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // `pathname` is read here so the effect genuinely depends on the route.
    if (pathname) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Feed />} />
          <Route path="create" element={<CreateThesis />} />
          <Route path="market/:address" element={<MarketDetail />} />
          <Route path="profile/:address" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
