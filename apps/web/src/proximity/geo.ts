import type { GeoPoint } from "@secretlayer/shared";

export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function positionToGeoPoint(pos: GeolocationPosition): GeoPoint {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    speed: pos.coords.speed,
    heading: pos.coords.heading,
    timestamp: new Date(pos.timestamp).toISOString(),
  };
}

export function watchGps(
  onUpdate: (point: GeoPoint) => void,
  onError: (msg: string) => void,
): () => void {
  if (!navigator.geolocation) {
    onError("Geolocation not supported on this device.");
    return () => {};
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate(positionToGeoPoint(pos)),
    (err) => onError(err.message),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );

  return () => navigator.geolocation.clearWatch(id);
}
