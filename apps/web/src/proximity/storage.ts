import type {
  KnownDevice,
  ProximityAnomaly,
  ProximitySnapshot,
  SavedPlace,
} from "@secretlayer/shared";

const DB_NAME = "proximity-guard";
const DB_VERSION = 1;

type StoreName = "snapshots" | "anomalies" | "knownDevices" | "places";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("snapshots")) {
        const store = db.createObjectStore("snapshots", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("anomalies")) {
        const store = db.createObjectStore("anomalies", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("knownDevices")) {
        db.createObjectStore("knownDevices", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("places")) {
        db.createObjectStore("places", { keyPath: "id" });
      }
    };
  });
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function remove(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveSnapshot(snapshot: ProximitySnapshot): Promise<void> {
  await put("snapshots", snapshot);
  const all = await getAll<ProximitySnapshot>("snapshots");
  if (all.length > 500) {
    const sorted = all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const toDelete = sorted.slice(0, all.length - 500);
    for (const s of toDelete) await remove("snapshots", s.id);
  }
}

export async function getSnapshots(limit = 50): Promise<ProximitySnapshot[]> {
  const all = await getAll<ProximitySnapshot>("snapshots");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function saveAnomaly(anomaly: ProximityAnomaly): Promise<void> {
  await put("anomalies", anomaly);
}

export async function getAnomalies(limit = 30): Promise<ProximityAnomaly[]> {
  const all = await getAll<ProximityAnomaly>("anomalies");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getKnownDevices(): Promise<KnownDevice[]> {
  return getAll<KnownDevice>("knownDevices");
}

export async function saveKnownDevice(device: KnownDevice): Promise<void> {
  await put("knownDevices", device);
}

export async function deleteKnownDevice(id: string): Promise<void> {
  await remove("knownDevices", id);
}

export async function getPlaces(): Promise<SavedPlace[]> {
  return getAll<SavedPlace>("places");
}

export async function savePlace(place: SavedPlace): Promise<void> {
  await put("places", place);
}

export async function deletePlace(id: string): Promise<void> {
  await remove("places", id);
}
