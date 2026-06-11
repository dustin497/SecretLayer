import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  BleDeviceReading,
  GeoPoint,
  KnownDevice,
  ProximitySnapshot,
  SavedPlace,
} from "@secretlayer/shared";
import { analyzeSnapshot, createReasonerState } from "./reasoner.js";

function geo(lat: number, lon: number, timestamp = "2026-06-11T12:00:00.000Z"): GeoPoint {
  return { latitude: lat, longitude: lon, accuracy: 10, timestamp };
}

function ble(id: string, name: string | null = null): BleDeviceReading {
  return { id, name, rssi: -60, lastSeen: "2026-06-11T12:00:00.000Z" };
}

function snapshot(
  overrides: Partial<ProximitySnapshot> & { location: GeoPoint },
): ProximitySnapshot {
  return {
    id: "snap-1",
    deviceId: "device-1",
    bleDevices: [],
    wifi: { ssid: null, bssid: null, rssi: null, saveData: false },
    networkTraffic: {
      timestamp: overrides.location.timestamp,
      effectiveType: "4g",
      downlinkMbps: 10,
      rttMs: 50,
      type: "cellular",
    },
    createdAt: overrides.location.timestamp,
    ...overrides,
  };
}

const home: SavedPlace = {
  id: "home",
  label: "Home",
  latitude: 37.77,
  longitude: -122.42,
  radiusM: 150,
  type: "home",
};

const work: SavedPlace = {
  id: "work",
  label: "Office",
  latitude: 37.78,
  longitude: -122.4,
  radiusM: 150,
  type: "work",
};

describe("analyzeSnapshot", () => {
  it("flags home-only devices seen away from home", () => {
    const known: KnownDevice = {
      id: "watch-1",
      label: "Galaxy Watch",
      category: "watch",
      presenceRule: "home-only",
      bleId: "ble-watch",
      createdAt: "2026-06-01T00:00:00.000Z",
    };
    const state = createReasonerState();
    const anomalies = analyzeSnapshot(
      snapshot({
        location: geo(37.78, -122.4),
        bleDevices: [ble("ble-watch", "Galaxy Watch")],
      }),
      [known],
      [home, work],
      state,
      [],
    );
    assert.ok(anomalies.some((a) => a.type === "known_device_unexpected"));
    assert.ok(anomalies.some((a) => a.title.includes("away from home")));
  });

  it("flags work-only devices seen away from work", () => {
    const known: KnownDevice = {
      id: "laptop-1",
      label: "Work laptop",
      category: "laptop",
      presenceRule: "work-only",
      bleId: "ble-laptop",
      createdAt: "2026-06-01T00:00:00.000Z",
    };
    const state = createReasonerState();
    const anomalies = analyzeSnapshot(
      snapshot({
        location: geo(37.77, -122.42),
        bleDevices: [ble("ble-laptop", "Work laptop")],
      }),
      [known],
      [home, work],
      state,
      [],
    );
    assert.ok(anomalies.some((a) => a.type === "known_device_unexpected"));
    assert.ok(anomalies.some((a) => a.title.includes("away from work")));
  });

  it("flags repeated unknown BLE devices after threshold sightings", () => {
    const state = createReasonerState();
    const loc = geo(37.77, -122.42);
    const base = snapshot({ location: loc, bleDevices: [ble("unknown-ble", "Mystery")] });

    analyzeSnapshot(base, [], [], state, []);
    analyzeSnapshot(base, [], [], state, []);
    const third = analyzeSnapshot(base, [], [], state, []);

    assert.ok(third.some((a) => a.type === "unknown_device_nearby"));
  });

  it("flags sudden location jumps", () => {
    const state = createReasonerState();
    const first = snapshot({ location: geo(37.77, -122.42, "2026-06-11T12:00:00.000Z") });
    analyzeSnapshot(first, [], [], state, []);

    const jumped = snapshot({
      id: "snap-2",
      location: geo(38.5, -121.5, "2026-06-11T12:00:30.000Z"),
    });
    const anomalies = analyzeSnapshot(jumped, [], [], state, [first]);

    assert.ok(anomalies.some((a) => a.type === "location_jump"));
  });
});
