import type { NetworkTrafficSample, WifiReading } from "@secretlayer/shared";

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  type?: string;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

function getConnection(): NetworkInformation | undefined {
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

export function readWifiInfo(): WifiReading {
  const conn = getConnection();
  return {
    ssid: null,
    bssid: null,
    rssi: null,
    effectiveType: conn?.effectiveType ?? null,
    downlinkMbps: conn?.downlink ?? null,
    rttMs: conn?.rtt ?? null,
    saveData: conn?.saveData ?? false,
  };
}

export function readTrafficSample(): NetworkTrafficSample {
  const conn = getConnection();
  return {
    timestamp: new Date().toISOString(),
    effectiveType: conn?.effectiveType ?? null,
    downlinkMbps: conn?.downlink ?? null,
    rttMs: conn?.rtt ?? null,
    type: conn?.type ?? null,
  };
}

export function watchNetwork(
  onChange: (sample: NetworkTrafficSample) => void,
): () => void {
  const conn = getConnection();
  if (!conn) return () => {};

  const handler = () => onChange(readTrafficSample());
  conn.addEventListener("change", handler);
  return () => conn.removeEventListener("change", handler);
}

export function isNetworkApiSupported(): boolean {
  return Boolean(getConnection());
}
