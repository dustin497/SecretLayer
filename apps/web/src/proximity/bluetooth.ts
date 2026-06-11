import type { BleDeviceReading } from "@secretlayer/shared";

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
}

interface BluetoothLEScanOptions {
  filters?: BluetoothLEScanFilter[];
  keepRepeatedDevices?: boolean;
  acceptAllAdvertisements?: boolean;
}

interface BluetoothLEScan {
  active: boolean;
  stop(): void;
}

interface BluetoothLEScanDeviceEvent extends Event {
  device: BluetoothDevice;
  rssi?: number;
  txPower?: number;
}

interface BluetoothWithScan extends Bluetooth {
  requestLEScan?(options?: BluetoothLEScanOptions): Promise<BluetoothLEScan>;
  addEventListener(type: "advertisementreceived", listener: (ev: BluetoothLEScanDeviceEvent) => void): void;
  removeEventListener(type: "advertisementreceived", listener: (ev: BluetoothLEScanDeviceEvent) => void): void;
}

function bytesToHex(data: DataView): string {
  const bytes: string[] = [];
  for (let i = 0; i < data.byteLength; i++) {
    bytes.push(data.getUint8(i).toString(16).padStart(2, "0"));
  }
  return bytes.join("");
}

export function isBleScanSupported(): boolean {
  const bt = navigator.bluetooth as BluetoothWithScan | undefined;
  return Boolean(bt?.requestLEScan);
}

export function isBleSupported(): boolean {
  return "bluetooth" in navigator;
}

export async function startBleScan(
  onDevice: (reading: BleDeviceReading) => void,
  onError: (msg: string) => void,
): Promise<() => void> {
  const bt = navigator.bluetooth as BluetoothWithScan | undefined;
  if (!bt) {
    onError("Web Bluetooth not available. Use Chrome on your Galaxy S25 FE.");
    return () => {};
  }

  const seen = new Map<string, BleDeviceReading>();

  const emit = (reading: BleDeviceReading) => {
    seen.set(reading.id, reading);
    onDevice(reading);
  };

  if (bt.requestLEScan) {
    try {
      const scan = await bt.requestLEScan({ acceptAllAdvertisements: true, keepRepeatedDevices: true });

      const handler = (event: BluetoothLEScanDeviceEvent) => {
        const device = event.device;
        let manufacturerData: string | undefined;
        if (device.manufacturerData) {
          for (const [, value] of device.manufacturerData) {
            manufacturerData = bytesToHex(value);
            break;
          }
        }
        emit({
          id: device.id,
          name: device.name ?? null,
          rssi: event.rssi ?? -100,
          txPower: event.txPower ?? null,
          manufacturerData,
          lastSeen: new Date().toISOString(),
        });
      };

      bt.addEventListener("advertisementreceived", handler);

      return () => {
        bt.removeEventListener("advertisementreceived", handler);
        if (scan.active) scan.stop();
      };
    } catch (err) {
      onError(err instanceof Error ? err.message : "BLE scan permission denied.");
      return () => {};
    }
  }

  onError("Passive BLE scan unavailable. Enable chrome://flags/#enable-experimental-web-platform-features or use Chrome 79+.");
  return () => {};
}

export function getBleSnapshot(devices: Map<string, BleDeviceReading>): BleDeviceReading[] {
  return [...devices.values()].sort((a, b) => b.rssi - a.rssi);
}
