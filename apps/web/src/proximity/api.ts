import type { ProximityAnomaly, ProximitySnapshot } from "@secretlayer/shared";

const API_BASE = "/api";

export async function syncSnapshot(snapshot: ProximitySnapshot): Promise<void> {
  try {
    await fetch(`${API_BASE}/proximity/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  } catch {
    // Offline — local IndexedDB is source of truth
  }
}

export async function syncAnomaly(anomaly: ProximityAnomaly): Promise<void> {
  try {
    await fetch(`${API_BASE}/proximity/anomalies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anomaly),
    });
  } catch {
    // Offline
  }
}

export async function fetchServerSnapshots(deviceId: string, limit = 20): Promise<ProximitySnapshot[]> {
  try {
    const res = await fetch(`${API_BASE}/proximity/snapshots?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.snapshots ?? [];
  } catch {
    return [];
  }
}
