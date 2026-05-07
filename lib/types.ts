export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  altitude: number | null;
}

export interface RunSession {
  id: string;
  startTime: number;
  endTime: number | null;
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  calories: number;
  isPaused: boolean;
  pausedDuration: number;
  territoriesClaimed: string[];
}

export interface Territory {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
  area: number;
  claimedAt: number;
  runId: string;
  color: string;
  centerLat: number;
  centerLng: number;
}

export interface UserStats {
  totalDistance: number;
  totalRuns: number;
  totalDuration: number;
  totalCalories: number;
  totalTerritories: number;
  totalArea: number;
  longestRun: number;
  fastestPace: number;
}

export interface RunHistoryItem {
  id: string;
  startTime: number;
  endTime: number;
  distance: number;
  duration: number;
  avgSpeed: number;
  calories: number;
  territoriesClaimed: number;
  coordinates: Coordinate[];
}

export type RunState = 'idle' | 'running' | 'paused';

export const MAX_RUNNING_SPEED = 7;
export const MIN_LOOP_POINTS = 20;
export const LOOP_CLOSE_DISTANCE = 30;
export const MIN_TERRITORY_AREA = 500;
export const GPS_UPDATE_INTERVAL = 2000;
export const GPS_MIN_DISTANCE = 3;
