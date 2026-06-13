import type { ReactNode } from "react";
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ApiLandingPage } from "./pages/ApiLanding";
import { AuthPage } from "./pages/Auth";
import { CostCalculator } from "./pages/CostCalculator";
import { Dashboard } from "./pages/Dashboard";
import { GuideArticle, GuidesIndex } from "./pages/Guides";
import { Landing } from "./pages/Landing";
import { ReferralPage } from "./pages/Referral";
import { SafetyPage } from "./pages/Safety";
import { WWH2Panel } from "./wwh2/WWH2Panel";

function Protected({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  const [wwh2MenuTrigger, setWwh2MenuTrigger] = useState(0);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing onOpenWwh2={() => setWwh2MenuTrigger((n) => n + 1)} />} />
          <Route path="/for/:slug" element={<ApiLandingPage />} />
          <Route path="/calculator" element={<CostCalculator />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/guides" element={<GuidesIndex />} />
          <Route path="/guides/:slug" element={<GuideArticle />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/app" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <WWH2Panel openMenuTrigger={wwh2MenuTrigger} />
    </AuthProvider>
  );
}
