export type SafetySeverity = "info" | "warn" | "critical";

export type SafetyCheckId =
  | "secret-leak-scan"
  | "encryption-at-rest"
  | "transport-security"
  | "auth-hardening"
  | "csp-headers"
  | "dependency-audit"
  | "vault-structure"
  | "rate-limiting"
  | "audit-logging";

export interface SafetyFinding {
  checkId: SafetyCheckId;
  severity: SafetySeverity;
  passed: boolean;
  title: string;
  detail: string;
  remediation?: string;
}

export interface SafetyReport {
  runAt: string;
  target: string;
  passed: boolean;
  score: number;
  findings: SafetyFinding[];
  blockers: SafetyFinding[];
}

export type PromotionChannel =
  | "deploy-production"
  | "marketing-site"
  | "social-announcement"
  | "changelog"
  | "email-waitlist";

export interface PromotionPlan {
  channels: PromotionChannel[];
  headline: string;
  body: string;
  safetyReportId: string;
}

export interface PromotionResult {
  approved: boolean;
  reason: string;
  plan?: PromotionPlan;
  executedAt?: string;
}

export interface VaultProject {
  id: string;
  name: string;
  description?: string;
  vaultIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Vault {
  id: string;
  projectId: string;
  label: string;
  itemCount: number;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  secrets: number;
  projects: number;
}

export const FREE_PLAN_LIMITS: PlanLimits = { secrets: 10, projects: 3 };

export interface WaitlistLead {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export interface Wwh2Feedback {
  id: string;
  playbookId: string;
  playbookTitle: string;
  rating: number;
  helpful: boolean;
  comment?: string;
  completedSteps: number;
  totalSteps: number;
  createdAt: string;
}

export interface Wwh2Stats {
  totalSessions: number;
  averageRating: number;
  helpfulPercent: number;
  playbookCounts: Record<string, number>;
}

/** Proximity Guard — device & location awareness */

export type DeviceCategory =
  | "car"
  | "watch"
  | "laptop"
  | "phone"
  | "headphones"
  | "tablet"
  | "other";

export type DevicePresenceRule =
  | "always-with-me"
  | "home-only"
  | "work-only"
  | "car-only"
  | "optional";

export type AnomalySeverity = "info" | "warn" | "alert";

export type AnomalyType =
  | "unknown_device_nearby"
  | "known_device_missing"
  | "known_device_unexpected"
  | "signal_drop"
  | "signal_surge"
  | "location_jump"
  | "wifi_fingerprint_mismatch";

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string;
}

export interface BleDeviceReading {
  id: string;
  name: string | null;
  rssi: number;
  txPower?: number | null;
  manufacturerData?: string;
  lastSeen: string;
}

export interface WifiReading {
  ssid: string | null;
  bssid: string | null;
  rssi: number | null;
  frequency?: number | null;
  linkSpeed?: number | null;
  effectiveType?: string | null;
  downlinkMbps?: number | null;
  rttMs?: number | null;
  saveData?: boolean;
}

export interface NetworkTrafficSample {
  timestamp: string;
  effectiveType: string | null;
  downlinkMbps: number | null;
  rttMs: number | null;
  type: string | null;
}

export interface KnownDevice {
  id: string;
  label: string;
  category: DeviceCategory;
  presenceRule: DevicePresenceRule;
  bleId?: string;
  bleName?: string;
  wifiBssid?: string;
  homeRadiusM?: number;
  notes?: string;
  createdAt: string;
}

export interface SavedPlace {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  type: "home" | "work" | "car" | "custom";
}

export interface ProximitySnapshot {
  id: string;
  deviceId: string;
  location: GeoPoint;
  bleDevices: BleDeviceReading[];
  wifi: WifiReading;
  networkTraffic: NetworkTrafficSample;
  createdAt: string;
}

export interface ProximityAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  relatedDeviceId?: string;
  relatedBleId?: string;
  location?: GeoPoint;
  snapshotId?: string;
  createdAt: string;
}

export interface ProximitySession {
  id: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
  snapshotCount: number;
  anomalyCount: number;
}
