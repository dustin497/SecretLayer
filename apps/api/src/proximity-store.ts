import type { ProximityAnomaly, ProximitySnapshot } from "@secretlayer/shared";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface ProximityStore {
  load(): Promise<void>;
  addSnapshot(snapshot: ProximitySnapshot): Promise<void>;
  getSnapshots(deviceId?: string, limit?: number): Promise<ProximitySnapshot[]>;
  addAnomaly(anomaly: ProximityAnomaly): Promise<void>;
  getAnomalies(deviceId?: string, limit?: number): Promise<ProximityAnomaly[]>;
  count(): Promise<{ snapshots: number; anomalies: number }>;
}

const DATA_DIR = process.env.PROXIMITY_DATA_DIR ?? join(process.cwd(), "data");
const SNAPSHOTS_FILE = join(DATA_DIR, "proximity-snapshots.json");
const ANOMALIES_FILE = join(DATA_DIR, "proximity-anomalies.json");
const MAX_ENTRIES = 2000;

export async function createProximityStore(): Promise<ProximityStore> {
  let snapshots: ProximitySnapshot[] = [];
  let anomalies: ProximityAnomaly[] = [];

  async function persist() {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2));
    await writeFile(ANOMALIES_FILE, JSON.stringify(anomalies, null, 2));
  }

  return {
    async load() {
      try {
        snapshots = JSON.parse(await readFile(SNAPSHOTS_FILE, "utf8")) as ProximitySnapshot[];
      } catch {
        snapshots = [];
      }
      try {
        anomalies = JSON.parse(await readFile(ANOMALIES_FILE, "utf8")) as ProximityAnomaly[];
      } catch {
        anomalies = [];
      }
    },

    async addSnapshot(snapshot) {
      snapshots.push(snapshot);
      if (snapshots.length > MAX_ENTRIES) snapshots = snapshots.slice(-MAX_ENTRIES);
      await persist();
    },

    async getSnapshots(deviceId, limit = 50) {
      let list = snapshots;
      if (deviceId) list = list.filter((s) => s.deviceId === deviceId);
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },

    async addAnomaly(anomaly) {
      anomalies.push(anomaly);
      if (anomalies.length > MAX_ENTRIES) anomalies = anomalies.slice(-MAX_ENTRIES);
      await persist();
    },

    async getAnomalies(deviceId, limit = 50) {
      let list = anomalies;
      if (deviceId) {
        const deviceSnapshots = new Set(
          snapshots.filter((s) => s.deviceId === deviceId).map((s) => s.id),
        );
        list = list.filter((a) => a.snapshotId && deviceSnapshots.has(a.snapshotId));
      }
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },

    async count() {
      return { snapshots: snapshots.length, anomalies: anomalies.length };
    },
  };
}
