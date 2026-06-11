interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly manufacturerData?: Map<number, DataView>;
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
}

type BluetoothServiceUUID = number | string;

interface Bluetooth extends EventTarget {
  requestLEScan?(options?: {
    filters?: BluetoothLEScanFilter[];
    keepRepeatedDevices?: boolean;
    acceptAllAdvertisements?: boolean;
  }): Promise<{ active: boolean; stop(): void }>;
  addEventListener(
    type: "advertisementreceived",
    listener: (ev: { device: BluetoothDevice; rssi?: number; txPower?: number }) => void,
  ): void;
  removeEventListener(
    type: "advertisementreceived",
    listener: (ev: { device: BluetoothDevice; rssi?: number; txPower?: number }) => void,
  ): void;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
