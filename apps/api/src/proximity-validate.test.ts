import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseProximityAnomaly, parseProximitySnapshot } from "./proximity-validate.js";

const validSnapshot = {
  id: "snap-1",
  deviceId: "device-1",
  location: {
    latitude: 37.77,
    longitude: -122.42,
    accuracy: 10,
    timestamp: "2026-06-11T12:00:00.000Z",
  },
  bleDevices: [{ id: "ble-1", name: "Watch", rssi: -55, lastSeen: "2026-06-11T12:00:00.000Z" }],
  wifi: { ssid: null, bssid: null, rssi: null },
  networkTraffic: {
    timestamp: "2026-06-11T12:00:00.000Z",
    effectiveType: "4g",
    downlinkMbps: 10,
    rttMs: 50,
    type: "cellular",
  },
  createdAt: "2026-06-11T12:00:00.000Z",
};

describe("parseProximitySnapshot", () => {
  it("accepts a valid snapshot payload", () => {
    const parsed = parseProximitySnapshot(validSnapshot);
    assert.ok(parsed);
    assert.equal(parsed?.id, "snap-1");
  });

  it("rejects payloads with missing location", () => {
    const { location: _location, ...invalid } = validSnapshot;
    assert.equal(parseProximitySnapshot(invalid), null);
  });

  it("rejects malformed BLE device arrays", () => {
    assert.equal(
      parseProximitySnapshot({ ...validSnapshot, bleDevices: [{ id: "x" }] }),
      null,
    );
  });
});

describe("parseProximityAnomaly", () => {
  it("accepts a valid anomaly payload", () => {
    const parsed = parseProximityAnomaly({
      id: "a-1",
      type: "signal_drop",
      severity: "warn",
      title: "Signal dropped",
      detail: "RTT spiked",
      createdAt: "2026-06-11T12:00:00.000Z",
    });
    assert.ok(parsed);
    assert.equal(parsed?.severity, "warn");
  });

  it("rejects unknown anomaly types", () => {
    assert.equal(
      parseProximityAnomaly({
        id: "a-1",
        type: "not_real",
        severity: "warn",
        title: "Bad",
        detail: "Bad",
        createdAt: "2026-06-11T12:00:00.000Z",
      }),
      null,
    );
  });
});
