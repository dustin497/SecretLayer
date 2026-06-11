import { useEffect, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { ProximityGuard } from "./pages/ProximityGuard";
import { WWH2Panel } from "./wwh2/WWH2Panel";

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

export function App() {
  const [wwh2MenuTrigger, setWwh2MenuTrigger] = useState(0);
  const route = useHashRoute();

  if (route.startsWith("#/proximity")) {
    return <ProximityGuard />;
  }

  return (
    <>
      <LandingPage onOpenWwh2={() => setWwh2MenuTrigger((n) => n + 1)} />
      <WWH2Panel openMenuTrigger={wwh2MenuTrigger} />
    </>
  );
}
