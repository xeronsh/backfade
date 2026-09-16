import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { AppShell } from "@/components/backfade/AppShell";
import Feed from "@/routes/Feed";
import Leaderboard from "@/routes/Leaderboard";
import PostThesis from "@/routes/PostThesis";
import Profile from "@/routes/Profile";
import ThesisThread from "@/routes/ThesisThread";

function LegacyThesisRedirect() {
  const { address } = useParams();
  return <Navigate to={address ? `/thesis/${address}` : "/"} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
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
          <Route path="post" element={<PostThesis />} />
          <Route path="thesis/:address" element={<ThesisThread />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile/:address" element={<Profile />} />
          <Route path="create" element={<Navigate to="/post" replace />} />
          <Route path="market/:address" element={<LegacyThesisRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
