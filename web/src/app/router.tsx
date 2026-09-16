import { motion, useReducedMotion } from "motion/react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/backfade/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { duration, ease } from "@/lib/motion";

const Feed = lazy(() => import("@/routes/Feed"));
const CreateThesis = lazy(() => import("@/routes/CreateThesis"));
const MarketDetail = lazy(() => import("@/routes/MarketDetail"));
const Profile = lazy(() => import("@/routes/Profile"));

function RouteFallback() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.fast, ease: ease.standard }}
    >
      <Skeleton className="mx-auto mt-12 h-72 max-w-page" />
    </motion.div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Feed />} />
          <Route path="create" element={<CreateThesis />} />
          <Route path="market/:address" element={<MarketDetail />} />
          <Route path="profile/:address" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
