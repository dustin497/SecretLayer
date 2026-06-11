import type {
  BleDeviceReading,
  GeoPoint,
  KnownDevice,
  NetworkTrafficSample,
  ProximityAnomaly,
  ProximitySnapshot,
  SavedPlace,
  WifiReading,
} from "@secretlayer/shared";
import { getBleSnapshot, startBleScan, isBleScanSupported } from "./bluetooth";
import { getDeviceId } from "./device-id";
import { watchGps } from "./geo";
import { readTrafficSample, readWifiInfo, watchNetwork } from "./network";
import { analyzeSnapshot, createReasonerState } from "./reasoner";
import { saveAnomaly, saveSnapshot, getSnapshots } from "./storage";
import { syncAnomaly, syncSnapshot } from "./api";

export interface EngineStatus {
  running: boolean;
  gpsActive: boolean;
  bleActive: boolean;
  networkActive: boolean;
  lastError: string | null;
  snapshotCount: number;
  anomalyCount: number;
}

export interface EngineCallbacks {
  onLocation: (point: GeoPoint) => void;
  onBleDevices: (devices: BleDeviceReading[]) => void;
  onWifi: (wifi: WifiReading) => void;
  onTraffic: (sample: NetworkTrafficSample) => void;
  onAnomaly: (anomaly: ProximityAnomaly) => void;
  onSnapshot: (snapshot: ProximitySnapshot) => void;
  onStatus: (status: EngineStatus) => void;
  onError: (msg: string) => void;
}

const SNAPSHOT_INTERVAL_MS = 15000;

export class ProximityEngine {
  private running = false;
  private location: GeoPoint | null = null;
  private bleDevices = new Map<string, BleDeviceReading>();
  private wifi: WifiReading = readWifiInfo();
  private traffic: NetworkTrafficSample = readTrafficSample();
  private stopGps: (() => void) | null = null;
  private stopBle: (() => void) | null = null;
  private stopNetwork: (() => void) | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private reasoner = createReasonerState();
  private snapshotCount = 0;
  private anomalyCount = 0;
  private lastError: string | null = null;
  private knownDevices: KnownDevice[] = [];
  private places: SavedPlace[] = [];

  constructor(private callbacks: EngineCallbacks) {}

  setKnownDevices(devices: KnownDevice[]) {
    this.knownDevices = devices;
  }

  setPlaces(places: SavedPlace[]) {
    this.places = places;
  }

  private emitStatus() {
    this.callbacks.onStatus({
      running: this.running,
      gpsActive: this.stopGps !== null,
      bleActive: this.stopBle !== null,
      networkActive: this.stopNetwork !== null,
      lastError: this.lastError,
      snapshotCount: this.snapshotCount,
      anomalyCount: this.anomalyCount,
    });
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.lastError = null;

    this.stopGps = watchGps(
      (point) => {
        this.location = point;
        this.callbacks.onLocation(point);
      },
      (msg) => {
        this.lastError = msg;
        this.callbacks.onError(msg);
        this.emitStatus();
      },
    );

    if (isBleScanSupported()) {
      this.stopBle = await startBleScan(
        (reading) => {
          this.bleDevices.set(reading.id, reading);
          this.callbacks.onBleDevices(getBleSnapshot(this.bleDevices));
        },
        (msg) => {
          this.lastError = msg;
          this.callbacks.onError(msg);
          this.emitStatus();
        },
      );
    }

    this.wifi = readWifiInfo();
    this.callbacks.onWifi(this.wifi);

    this.traffic = readTrafficSample();
    this.callbacks.onTraffic(this.traffic);

    this.stopNetwork = watchNetwork((sample) => {
      this.traffic = sample;
      this.wifi = readWifiInfo();
      this.callbacks.onTraffic(sample);
      this.callbacks.onWifi(this.wifi);
    });

    this.snapshotTimer = setInterval(() => void this.captureSnapshot(), SNAPSHOT_INTERVAL_MS);
    void this.captureSnapshot();
    this.emitStatus();
  }

  stop() {
    this.running = false;
    this.stopGps?.();
    this.stopBle?.();
    this.stopNetwork?.();
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    this.stopGps = null;
    this.stopBle = null;
    this.stopNetwork = null;
    this.snapshotTimer = null;
    this.emitStatus();
  }

  private async captureSnapshot() {
    if (!this.running || !this.location) return;

    const snapshot: ProximitySnapshot = {
      id: crypto.randomUUID(),
      deviceId: getDeviceId(),
      location: this.location,
      bleDevices: getBleSnapshot(this.bleDevices),
      wifi: this.wifi,
      networkTraffic: this.traffic,
      createdAt: new Date().toISOString(),
    };

    await saveSnapshot(snapshot);
    this.snapshotCount++;
    this.callbacks.onSnapshot(snapshot);
    void syncSnapshot(snapshot);

    const recent = await getSnapshots(10);
    const anomalies = analyzeSnapshot(
      snapshot,
      this.knownDevices,
      this.places,
      this.reasoner,
      recent,
    );

    for (const anomaly of anomalies) {
      await saveAnomaly(anomaly);
      this.anomalyCount++;
      this.callbacks.onAnomaly(anomaly);
      void syncAnomaly(anomaly);
    }

    this.emitStatus();
  }
}
