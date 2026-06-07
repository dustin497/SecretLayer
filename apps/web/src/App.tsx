import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { SafetyPage } from "./pages/Safety";

function Protected({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/app" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
