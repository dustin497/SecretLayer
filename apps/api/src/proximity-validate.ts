import type { ProximityAnomaly, ProximitySnapshot } from "@secretlayer/shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isGeoPoint(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    typeof value.accuracy === "number" &&
    isNonEmptyString(value.timestamp)
  );
}

function isBleDeviceReading(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    (value.name === null || typeof value.name === "string") &&
    typeof value.rssi === "number" &&
    isNonEmptyString(value.lastSeen)
  );
}

function isWifiReading(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    (value.ssid === null || typeof value.ssid === "string") &&
    (value.bssid === null || typeof value.bssid === "string") &&
    (value.rssi === null || typeof value.rssi === "number")
  );
}

function isNetworkTrafficSample(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.timestamp);
}

const ANOMALY_TYPES = new Set([
  "unknown_device_nearby",
  "known_device_missing",
  "known_device_unexpected",
  "signal_drop",
  "signal_surge",
  "location_jump",
  "wifi_fingerprint_mismatch",
]);

const ANOMALY_SEVERITIES = new Set(["info", "warn", "alert"]);

export function parseProximitySnapshot(body: unknown): ProximitySnapshot | null {
  if (!isRecord(body)) return null;
  if (
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.deviceId) ||
    !isGeoPoint(body.location) ||
    !isNonEmptyString(body.createdAt)
  ) {
    return null;
  }
  if (!Array.isArray(body.bleDevices) || !body.bleDevices.every(isBleDeviceReading)) {
    return null;
  }
  if (!isWifiReading(body.wifi) || !isNetworkTrafficSample(body.networkTraffic)) {
    return null;
  }
  return body as unknown as ProximitySnapshot;
}

export function parseProximityAnomaly(body: unknown): ProximityAnomaly | null {
  if (!isRecord(body)) return null;
  if (
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.title) ||
    !isNonEmptyString(body.detail) ||
    !isNonEmptyString(body.createdAt) ||
    typeof body.type !== "string" ||
    !ANOMALY_TYPES.has(body.type) ||
    typeof body.severity !== "string" ||
    !ANOMALY_SEVERITIES.has(body.severity)
  ) {
    return null;
  }
  if (body.location !== undefined && !isGeoPoint(body.location)) return null;
  return body as unknown as ProximityAnomaly;
}
