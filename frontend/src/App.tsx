import type { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { CabinetPage } from "./pages/CabinetPage";
import { TasksPage } from "./pages/TasksPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { SubjectPage } from "./pages/SubjectPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { SharedWithMePage } from "./pages/SharedWithMePage";
import { SharePage } from "./pages/SharePage";
import { ProfilePage } from "./pages/ProfilePage";

import { Loader2 } from "lucide-react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-sm font-semibold tracking-wider text-dim">Loading...</span>
        </div>
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Public deep-link landing — handles its own auth gating (T-34) */}
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/cabinet" element={<RequireAuth><CabinetPage /></RequireAuth>} />
        <Route path="/tasks" element={<RequireAuth><TasksPage /></RequireAuth>} />
        <Route path="/tasks/:taskId" element={<RequireAuth><TaskDetailPage /></RequireAuth>} />
        <Route path="/shared" element={<RequireAuth><SharedWithMePage /></RequireAuth>} />
        <Route path="/subjects" element={<RequireAuth><SubjectsPage /></RequireAuth>} />
        <Route path="/subjects/:subjectId" element={<RequireAuth><SubjectPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
