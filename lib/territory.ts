import { Coordinate, Territory, LOOP_CLOSE_DISTANCE, MIN_LOOP_POINTS, MIN_TERRITORY_AREA } from './types';
import * as Crypto from 'expo-crypto';

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePolygonArea(coords: { latitude: number; longitude: number }[]): number {
  if (coords.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = toRadians(coords[i].latitude);
    const lat2 = toRadians(coords[j].latitude);
    const dLon = toRadians(coords[j].longitude - coords[i].longitude);
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 2);
  return area;
}

function calculateCentroid(coords: { latitude: number; longitude: number }[]): { lat: number; lng: number } {
  let latSum = 0;
  let lngSum = 0;
  for (const c of coords) {
    latSum += c.latitude;
    lngSum += c.longitude;
  }
  return { lat: latSum / coords.length, lng: lngSum / coords.length };
}

export function detectClosedLoops(
  coordinates: Coordinate[],
  existingTerritories: Territory[]
): { loopCoords: { latitude: number; longitude: number }[]; startIdx: number; endIdx: number }[] {
  const loops: { loopCoords: { latitude: number; longitude: number }[]; startIdx: number; endIdx: number }[] = [];
  if (coordinates.length < MIN_LOOP_POINTS) return loops;

  const usedIndices = new Set<number>();

  for (let i = 0; i < coordinates.length - MIN_LOOP_POINTS; i++) {
    if (usedIndices.has(i)) continue;

    for (let j = i + MIN_LOOP_POINTS; j < coordinates.length; j++) {
      if (usedIndices.has(j)) continue;

      const dist = haversineDistance(
        coordinates[i].latitude,
        coordinates[i].longitude,
        coordinates[j].latitude,
        coordinates[j].longitude
      );

      if (dist < LOOP_CLOSE_DISTANCE) {
        const loopCoords = coordinates.slice(i, j + 1).map((c) => ({
          latitude: c.latitude,
          longitude: c.longitude,
        }));

        const area = calculatePolygonArea(loopCoords);
        if (area >= MIN_TERRITORY_AREA) {
          loops.push({ loopCoords, startIdx: i, endIdx: j });
          for (let k = i; k <= j; k++) usedIndices.add(k);
          break;
        }
      }
    }
  }

  return loops;
}

export function createTerritory(
  loopCoords: { latitude: number; longitude: number }[],
  runId: string
): Territory {
  const area = calculatePolygonArea(loopCoords);
  const centroid = calculateCentroid(loopCoords);

  const simplified = simplifyPath(loopCoords, 0.00005);

  return {
    id: Crypto.randomUUID(),
    coordinates: simplified,
    area,
    claimedAt: Date.now(),
    runId,
    color: generateTerritoryColor(),
    centerLat: centroid.lat,
    centerLng: centroid.lng,
  };
}

function simplifyPath(
  coords: { latitude: number; longitude: number }[],
  epsilon: number
): { latitude: number; longitude: number }[] {
  if (coords.length <= 2) return coords;

  let maxDist = 0;
  let maxIdx = 0;
  const start = coords[0];
  const end = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const dist = pointToLineDistance(coords[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(coords.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(coords.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function pointToLineDistance(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number }
): number {
  const A = point.latitude - lineStart.latitude;
  const B = point.longitude - lineStart.longitude;
  const C = lineEnd.latitude - lineStart.latitude;
  const D = lineEnd.longitude - lineStart.longitude;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  param = Math.max(0, Math.min(1, param));

  const xx = lineStart.latitude + param * C;
  const yy = lineStart.longitude + param * D;
  const dx = point.latitude - xx;
  const dy = point.longitude - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

const TERRITORY_COLORS = [
  'rgba(0, 212, 170, 0.35)',
  'rgba(59, 130, 246, 0.35)',
  'rgba(168, 85, 247, 0.35)',
  'rgba(236, 72, 153, 0.35)',
  'rgba(245, 158, 11, 0.35)',
  'rgba(16, 185, 129, 0.35)',
  'rgba(99, 102, 241, 0.35)',
];

let colorIndex = 0;
function generateTerritoryColor(): string {
  const color = TERRITORY_COLORS[colorIndex % TERRITORY_COLORS.length];
  colorIndex++;
  return color;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(speedMs: number): string {
  if (speedMs <= 0) return '--:--';
  const paceMinPerKm = 1000 / speedMs / 60;
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function estimateCalories(distanceMeters: number, durationSeconds: number): number {
  const weight = 70;
  const speedMs = durationSeconds > 0 ? distanceMeters / durationSeconds : 0;
  let met = 1;
  if (speedMs < 1.4) met = 2.0;
  else if (speedMs < 2.0) met = 3.5;
  else if (speedMs < 2.8) met = 5.0;
  else if (speedMs < 3.6) met = 8.0;
  else if (speedMs < 4.5) met = 10.0;
  else met = 12.0;
  const hours = durationSeconds / 3600;
  return Math.round(met * weight * hours);
}

export function formatArea(sqMeters: number): string {
  if (sqMeters < 10000) return `${Math.round(sqMeters)} m²`;
  return `${(sqMeters / 10000).toFixed(2)} ha`;
}
