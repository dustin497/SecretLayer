import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BleDeviceReading,
  DeviceCategory,
  DevicePresenceRule,
  GeoPoint,
  KnownDevice,
  NetworkTrafficSample,
  ProximityAnomaly,
  ProximitySnapshot,
  SavedPlace,
  WifiReading,
} from "@secretlayer/shared";
import { ProximityEngine, type EngineStatus } from "../proximity/engine";
import { isBleScanSupported, isBleSupported } from "../proximity/bluetooth";
import { isNetworkApiSupported } from "../proximity/network";
import {
  deleteKnownDevice,
  deletePlace,
  getAnomalies,
  getKnownDevices,
  getPlaces,
  getSnapshots,
  saveKnownDevice,
  savePlace,
} from "../proximity/storage";

const CATEGORIES: DeviceCategory[] = ["car", "watch", "laptop", "phone", "headphones", "tablet", "other"];
const RULES: DevicePresenceRule[] = ["always-with-me", "home-only", "work-only", "car-only", "optional"];

function formatCoord(n: number, digits = 5) {
  return n.toFixed(digits);
}

function rssiBar(rssi: number) {
  if (rssi >= -50) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

function severityClass(s: ProximityAnomaly["severity"]) {
  if (s === "alert") return "pg-severity-alert";
  if (s === "warn") return "pg-severity-warn";
  return "pg-severity-info";
}

export function ProximityGuard() {
  const engineRef = useRef<ProximityEngine | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [bleDevices, setBleDevices] = useState<BleDeviceReading[]>([]);
  const [wifi, setWifi] = useState<WifiReading | null>(null);
  const [traffic, setTraffic] = useState<NetworkTrafficSample | null>(null);
  const [trafficHistory, setTrafficHistory] = useState<NetworkTrafficSample[]>([]);
  const [anomalies, setAnomalies] = useState<ProximityAnomaly[]>([]);
  const [snapshots, setSnapshots] = useState<ProximitySnapshot[]>([]);
  const [knownDevices, setKnownDevices] = useState<KnownDevice[]>([]);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "devices" | "places" | "history">("live");

  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<DeviceCategory>("watch");
  const [newRule, setNewRule] = useState<DevicePresenceRule>("always-with-me");
  const [newBleId, setNewBleId] = useState("");

  const [placeLabel, setPlaceLabel] = useState("");
  const [placeType, setPlaceType] = useState<SavedPlace["type"]>("home");

  const loadData = useCallback(async () => {
    setKnownDevices(await getKnownDevices());
    setPlaces(await getPlaces());
    setAnomalies(await getAnomalies());
    setSnapshots(await getSnapshots(20));
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  const startMonitoring = useCallback(async () => {
    setError(null);
    const known = await getKnownDevices();
    const savedPlaces = await getPlaces();

    const engine = new ProximityEngine({
      onLocation: setLocation,
      onBleDevices: setBleDevices,
      onWifi: setWifi,
      onTraffic: (sample) => {
        setTraffic(sample);
        setTrafficHistory((prev) => [...prev.slice(-29), sample]);
      },
      onAnomaly: (a) => setAnomalies((prev) => [a, ...prev].slice(0, 50)),
      onSnapshot: (s) => setSnapshots((prev) => [s, ...prev].slice(0, 20)),
      onStatus: setStatus,
      onError: setError,
    });

    engine.setKnownDevices(known);
    engine.setPlaces(savedPlaces);
    engineRef.current = engine;
    await engine.start();
    setMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setMonitoring(false);
  }, []);

  const addKnownDevice = async () => {
    if (!newLabel.trim()) return;
    const device: KnownDevice = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      category: newCategory,
      presenceRule: newRule,
      bleId: newBleId.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await saveKnownDevice(device);
    setKnownDevices(await getKnownDevices());
    engineRef.current?.setKnownDevices(await getKnownDevices());
    setNewLabel("");
    setNewBleId("");
  };

  const tagBleAsMine = async (ble: BleDeviceReading) => {
    const device: KnownDevice = {
      id: crypto.randomUUID(),
      label: ble.name ?? `Device ${ble.id.slice(0, 6)}`,
      category: "other",
      presenceRule: "always-with-me",
      bleId: ble.id,
      bleName: ble.name ?? undefined,
      createdAt: new Date().toISOString(),
    };
    await saveKnownDevice(device);
    setKnownDevices(await getKnownDevices());
    engineRef.current?.setKnownDevices(await getKnownDevices());
  };

  const saveCurrentPlace = async () => {
    if (!location || !placeLabel.trim()) return;
    const place: SavedPlace = {
      id: crypto.randomUUID(),
      label: placeLabel.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      radiusM: placeType === "car" ? 30 : 150,
      type: placeType,
    };
    await savePlace(place);
    setPlaces(await getPlaces());
    engineRef.current?.setPlaces(await getPlaces());
    setPlaceLabel("");
  };

  return (
    <div className="pg-page">
      <header className="pg-header">
        <a href="/" className="pg-back">
          ← SecretLayer
        </a>
        <p className="pg-eyebrow">Proximity Guard</p>
        <h1>What&apos;s around you</h1>
        <p className="pg-lead">
          Live GPS, Bluetooth, and network monitoring for your Galaxy S25 FE. Tags your car, watch,
          and laptop — flags when something nearby doesn&apos;t belong.
        </p>
      </header>

      <div className="pg-capabilities">
        <span className={location ? "pg-cap on" : "pg-cap"}>GPS</span>
        <span className={isBleSupported() ? "pg-cap on" : "pg-cap off"}>Bluetooth</span>
        <span className={isBleScanSupported() ? "pg-cap on" : "pg-cap warn"}>BLE Scan</span>
        <span className={isNetworkApiSupported() ? "pg-cap on" : "pg-cap off"}>Network</span>
      </div>

      {!isBleScanSupported() && (
        <div className="pg-notice">
          <strong>Galaxy S25 FE tip:</strong> Open this site in <strong>Chrome</strong> (not Samsung
          Internet) for passive BLE scanning. Full WiFi AP scanning requires a native app — we monitor
          connection strength (RTT/downlink) instead.
        </div>
      )}

      <div className="pg-controls">
        {!monitoring ? (
          <button type="button" className="pg-btn-primary" onClick={() => void startMonitoring()}>
            Start monitoring
          </button>
        ) : (
          <button type="button" className="pg-btn-danger" onClick={stopMonitoring}>
            Stop monitoring
          </button>
        )}
        {status && (
          <span className="pg-status-pill">
            {status.snapshotCount} snapshots · {status.anomalyCount} anomalies
          </span>
        )}
      </div>

      {error && <div className="pg-error">{error}</div>}

      <nav className="pg-tabs">
        {(["live", "devices", "places", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "pg-tab active" : "pg-tab"}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "live" && (
        <div className="pg-grid">
          <section className="pg-card">
            <h2>Your location</h2>
            {location ? (
              <>
                <p className="pg-coords">
                  {formatCoord(location.latitude)}, {formatCoord(location.longitude)}
                </p>
                <p className="pg-meta">
                  ±{Math.round(location.accuracy)}m
                  {location.speed != null && location.speed > 0.5
                    ? ` · ${(location.speed * 3.6).toFixed(0)} km/h`
                    : ""}
                </p>
                <a
                  className="pg-map-link"
                  href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              </>
            ) : (
              <p className="pg-muted">Waiting for GPS fix… Allow location when prompted.</p>
            )}
          </section>

          <section className="pg-card">
            <h2>Network signal</h2>
            {wifi ? (
              <dl className="pg-dl">
                <dt>Type</dt>
                <dd>{wifi.effectiveType ?? traffic?.type ?? "—"}</dd>
                <dt>Downlink</dt>
                <dd>{wifi.downlinkMbps != null ? `${wifi.downlinkMbps.toFixed(1)} Mbps` : "—"}</dd>
                <dt>RTT</dt>
                <dd>{wifi.rttMs != null ? `${wifi.rttMs} ms` : "—"}</dd>
              </dl>
            ) : (
              <p className="pg-muted">Network API unavailable.</p>
            )}
            {trafficHistory.length > 1 && (
              <div className="pg-sparkline" aria-hidden>
                {trafficHistory.map((s, i) => {
                  const max = Math.max(...trafficHistory.map((x) => x.rttMs ?? 0), 1);
                  const h = ((s.rttMs ?? 0) / max) * 100;
                  return <div key={i} className="pg-bar" style={{ height: `${Math.max(h, 4)}%` }} />;
                })}
              </div>
            )}
            <p className="pg-meta">Traffic in/out — RTT spikes flag weak coverage.</p>
          </section>

          <section className="pg-card pg-card-wide">
            <h2>Bluetooth nearby ({bleDevices.length})</h2>
            {bleDevices.length === 0 ? (
              <p className="pg-muted">
                {monitoring
                  ? "Scanning for BLE advertisements…"
                  : "Start monitoring to scan nearby Bluetooth devices."}
              </p>
            ) : (
              <ul className="pg-ble-list">
                {bleDevices.map((d) => {
                  const known = knownDevices.some(
                    (k) => k.bleId === d.id || (k.bleName && d.name && k.bleName === d.name),
                  );
                  return (
                    <li key={d.id} className={known ? "pg-ble known" : "pg-ble"}>
                      <div className="pg-ble-signal">
                        {Array.from({ length: 4 }, (_, i) => (
                          <span key={i} className={i < rssiBar(d.rssi) ? "bar on" : "bar"} />
                        ))}
                      </div>
                      <div className="pg-ble-info">
                        <strong>{d.name ?? "Unknown"}</strong>
                        <span className="pg-meta">
                          {d.rssi} dBm · {d.id.slice(0, 8)}…
                        </span>
                      </div>
                      {known ? (
                        <span className="pg-tag mine">Mine</span>
                      ) : (
                        <button type="button" className="pg-btn-small" onClick={() => void tagBleAsMine(d)}>
                          Tag mine
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="pg-card pg-card-wide">
            <h2>Anomalies</h2>
            {anomalies.length === 0 ? (
              <p className="pg-muted">No anomalies yet. Tag your devices so we know what belongs with you.</p>
            ) : (
              <ul className="pg-anomaly-list">
                {anomalies.slice(0, 8).map((a) => (
                  <li key={a.id} className={`pg-anomaly ${severityClass(a.severity)}`}>
                    <strong>{a.title}</strong>
                    <p>{a.detail}</p>
                    <time>{new Date(a.createdAt).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "devices" && (
        <div className="pg-grid">
          <section className="pg-card pg-card-wide">
            <h2>My devices</h2>
            <p className="pg-muted">
              Label devices that should travel with you — car stereo, Galaxy Watch, laptop, etc.
            </p>
            <ul className="pg-device-list">
              {knownDevices.map((d) => (
                <li key={d.id}>
                  <span className="pg-tag">{d.category}</span>
                  <strong>{d.label}</strong>
                  <span className="pg-meta">{d.presenceRule}</span>
                  <button
                    type="button"
                    className="pg-btn-small danger"
                    onClick={() =>
                      void deleteKnownDevice(d.id).then(async () => {
                        await loadData();
                        engineRef.current?.setKnownDevices(await getKnownDevices());
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="pg-form">
              <input
                placeholder="Label (e.g. My car, Galaxy Watch)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as DeviceCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={newRule} onChange={(e) => setNewRule(e.target.value as DevicePresenceRule)}>
                {RULES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                placeholder="BLE ID (optional — tap Tag mine on Live tab)"
                value={newBleId}
                onChange={(e) => setNewBleId(e.target.value)}
              />
              <button type="button" className="pg-btn-primary" onClick={() => void addKnownDevice()}>
                Add device
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "places" && (
        <div className="pg-grid">
          <section className="pg-card pg-card-wide">
            <h2>Saved places</h2>
            <p className="pg-muted">Mark home, work, or where you park — used to reason about device presence.</p>
            <ul className="pg-place-list">
              {places.map((p) => (
                <li key={p.id}>
                  <strong>{p.label}</strong>
                  <span className="pg-tag">{p.type}</span>
                  <span className="pg-meta">
                    {formatCoord(p.latitude, 4)}, {formatCoord(p.longitude, 4)} · {p.radiusM}m
                  </span>
                  <button
                    type="button"
                    className="pg-btn-small danger"
                    onClick={() =>
                      void deletePlace(p.id).then(async () => {
                        await loadData();
                        engineRef.current?.setPlaces(await getPlaces());
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {location && (
              <div className="pg-form">
                <input
                  placeholder="Place name (e.g. Home, Office parking)"
                  value={placeLabel}
                  onChange={(e) => setPlaceLabel(e.target.value)}
                />
                <select value={placeType} onChange={(e) => setPlaceType(e.target.value as SavedPlace["type"])}>
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="car">Car / parking</option>
                  <option value="custom">Custom</option>
                </select>
                <button type="button" className="pg-btn-primary" onClick={() => void saveCurrentPlace()}>
                  Save current GPS as place
                </button>
              </div>
            )}
            {!location && <p className="pg-muted">Start monitoring to capture your current coordinates.</p>}
          </section>
        </div>
      )}

      {tab === "history" && (
        <div className="pg-grid">
          <section className="pg-card pg-card-wide">
            <h2>Snapshot history</h2>
            <ul className="pg-history-list">
              {snapshots.map((s) => (
                <li key={s.id}>
                  <time>{new Date(s.createdAt).toLocaleString()}</time>
                  <span>
                    {formatCoord(s.location.latitude, 4)}, {formatCoord(s.location.longitude, 4)}
                  </span>
                  <span className="pg-meta">
                    {s.bleDevices.length} BLE · {s.wifi.effectiveType ?? "—"} · RTT {s.networkTraffic.rttMs ?? "—"}ms
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
