import type {
  AnomalySeverity,
  AnomalyType,
  BleDeviceReading,
  GeoPoint,
  KnownDevice,
  ProximityAnomaly,
  ProximitySnapshot,
  SavedPlace,
} from "@secretlayer/shared";
import { haversineM } from "./geo";

const UNKNOWN_SEEN_THRESHOLD = 3;

interface ReasonerState {
  unknownSightings: Map<string, { count: number; location: GeoPoint }>;
  lastTrafficRtt: number | null;
  lastTrafficDownlink: number | null;
  lastLocation: GeoPoint | null;
  knownBleSeen: Set<string>;
}

export function createReasonerState(): ReasonerState {
  return {
    unknownSightings: new Map(),
    lastTrafficRtt: null,
    lastTrafficDownlink: null,
    lastLocation: null,
    knownBleSeen: new Set(),
  };
}

function makeAnomaly(
  type: AnomalyType,
  severity: AnomalySeverity,
  title: string,
  detail: string,
  extras?: Partial<ProximityAnomaly>,
): ProximityAnomaly {
  return {
    id: crypto.randomUUID(),
    type,
    severity,
    title,
    detail,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}

function isAtPlace(point: GeoPoint, place: SavedPlace): boolean {
  return haversineM(point, { ...point, latitude: place.latitude, longitude: place.longitude }) <= place.radiusM;
}

function findPlaceAt(point: GeoPoint, places: SavedPlace[]): SavedPlace | undefined {
  return places.find((p) => isAtPlace(point, p));
}

function matchKnownDevice(ble: BleDeviceReading, known: KnownDevice[]): KnownDevice | undefined {
  return known.find(
    (k) =>
      (k.bleId && k.bleId === ble.id) ||
      (k.bleName && ble.name && k.bleName.toLowerCase() === ble.name.toLowerCase()),
  );
}

export function analyzeSnapshot(
  snapshot: ProximitySnapshot,
  knownDevices: KnownDevice[],
  places: SavedPlace[],
  state: ReasonerState,
  recentSnapshots: ProximitySnapshot[],
): ProximityAnomaly[] {
  const anomalies: ProximityAnomaly[] = [];
  const loc = snapshot.location;
  const currentPlace = findPlaceAt(loc, places);

  if (state.lastLocation) {
    const dist = haversineM(state.lastLocation, loc);
    const dt =
      (new Date(loc.timestamp).getTime() - new Date(state.lastLocation.timestamp).getTime()) / 1000;
    if (dt > 0 && dt < 120 && dist > 5000) {
      anomalies.push(
        makeAnomaly(
          "location_jump",
          "warn",
          "Sudden location jump",
          `Moved ${Math.round(dist)}m in ${Math.round(dt)}s — GPS glitch or rapid transit.`,
          { location: loc, snapshotId: snapshot.id },
        ),
      );
    }
  }
  state.lastLocation = loc;

  const seenKnown = new Set<string>();
  for (const ble of snapshot.bleDevices) {
    const known = matchKnownDevice(ble, knownDevices);
    if (known) {
      seenKnown.add(known.id);
      state.knownBleSeen.add(ble.id);

      if (known.presenceRule === "home-only" && currentPlace?.type !== "home") {
        anomalies.push(
          makeAnomaly(
            "known_device_unexpected",
            "alert",
            `${known.label} seen away from home`,
            `Your ${known.category} "${known.label}" was detected at an unexpected location.`,
            { relatedDeviceId: known.id, relatedBleId: ble.id, location: loc, snapshotId: snapshot.id },
          ),
        );
      }
      if (known.presenceRule === "car-only" && currentPlace?.type !== "car" && (loc.speed ?? 0) < 2) {
        anomalies.push(
          makeAnomaly(
            "known_device_unexpected",
            "warn",
            `${known.label} detected while stationary`,
            `Car device "${known.label}" is nearby but you appear parked outside your car zone.`,
            { relatedDeviceId: known.id, relatedBleId: ble.id, location: loc, snapshotId: snapshot.id },
          ),
        );
      }
    } else {
      const key = ble.id;
      const prev = state.unknownSightings.get(key);
      const count = (prev?.count ?? 0) + 1;
      state.unknownSightings.set(key, { count, location: loc });
      if (count === UNKNOWN_SEEN_THRESHOLD) {
        anomalies.push(
          makeAnomaly(
            "unknown_device_nearby",
            "warn",
            "Repeated unknown device",
            `Unrecognized BLE device ${ble.name ?? ble.id.slice(0, 8)} seen ${count} times near you.`,
            { relatedBleId: ble.id, location: loc, snapshotId: snapshot.id },
          ),
        );
      }
    }
  }

  for (const known of knownDevices) {
    if (known.presenceRule !== "always-with-me") continue;
    const bleId = known.bleId ?? known.bleName;
    if (!bleId) continue;
    const wasSeenRecently = recentSnapshots
      .slice(0, 5)
      .some((s) => s.bleDevices.some((ble: BleDeviceReading) => matchKnownDevice(ble, [known])));
    const isSeenNow = seenKnown.has(known.id);
    if (wasSeenRecently && !isSeenNow) {
      anomalies.push(
        makeAnomaly(
          "known_device_missing",
          "warn",
          `${known.label} no longer detected`,
          `Your ${known.category} "${known.label}" was with you but dropped off the scan.`,
          { relatedDeviceId: known.id, location: loc, snapshotId: snapshot.id },
        ),
      );
    }
  }

  const { rttMs, downlinkMbps } = snapshot.networkTraffic;
  if (state.lastTrafficRtt !== null && rttMs !== null) {
    if (rttMs > state.lastTrafficRtt * 2 && rttMs > 200) {
      anomalies.push(
        makeAnomaly(
          "signal_drop",
          "info",
          "Network latency spike",
          `RTT jumped to ${rttMs}ms (was ~${Math.round(state.lastTrafficRtt)}ms). Possible weak signal or congestion.`,
          { snapshotId: snapshot.id },
        ),
      );
    }
    if (rttMs < state.lastTrafficRtt * 0.4 && state.lastTrafficRtt > 100) {
      anomalies.push(
        makeAnomaly(
          "signal_surge",
          "info",
          "Network latency improved sharply",
          `RTT dropped to ${rttMs}ms — you may have moved to stronger coverage.`,
          { snapshotId: snapshot.id },
        ),
      );
    }
  }
  if (state.lastTrafficDownlink !== null && downlinkMbps !== null) {
    if (downlinkMbps < state.lastTrafficDownlink * 0.3 && state.lastTrafficDownlink > 1) {
      anomalies.push(
        makeAnomaly(
          "signal_drop",
          "warn",
          "Download speed dropped",
          `Downlink fell to ${downlinkMbps.toFixed(1)} Mbps from ~${state.lastTrafficDownlink.toFixed(1)} Mbps.`,
          { snapshotId: snapshot.id },
        ),
      );
    }
  }
  state.lastTrafficRtt = rttMs;
  state.lastTrafficDownlink = downlinkMbps;

  if (currentPlace && snapshot.wifi.ssid) {
    const usualAtPlace = recentSnapshots
      .filter((s) => {
        const p = findPlaceAt(s.location, places);
        return p?.id === currentPlace.id;
      })
      .map((s) => s.wifi.effectiveType)
      .filter(Boolean);
    const unique = [...new Set(usualAtPlace)];
    if (
      unique.length >= 3 &&
      snapshot.wifi.effectiveType &&
      !unique.includes(snapshot.wifi.effectiveType)
    ) {
      anomalies.push(
        makeAnomaly(
          "wifi_fingerprint_mismatch",
          "info",
          "Network profile differs here",
          `Connection type "${snapshot.wifi.effectiveType}" is unusual for ${currentPlace.label}.`,
          { snapshotId: snapshot.id, location: loc },
        ),
      );
    }
  }

  return anomalies;
}
