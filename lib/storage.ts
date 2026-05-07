import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunHistoryItem, Territory, UserStats } from './types';

const KEYS = {
  RUN_HISTORY: 'territory_runner_runs',
  TERRITORIES: 'territory_runner_territories',
  USER_STATS: 'territory_runner_stats',
};

const DEFAULT_STATS: UserStats = {
  totalDistance: 0,
  totalRuns: 0,
  totalDuration: 0,
  totalCalories: 0,
  totalTerritories: 0,
  totalArea: 0,
  longestRun: 0,
  fastestPace: 0,
};

export async function getRunHistory(): Promise<RunHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RUN_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveRun(run: RunHistoryItem): Promise<void> {
  const history = await getRunHistory();
  history.unshift(run);
  await AsyncStorage.setItem(KEYS.RUN_HISTORY, JSON.stringify(history));
}

export async function deleteRun(runId: string): Promise<void> {
  const history = await getRunHistory();
  const filtered = history.filter((r) => r.id !== runId);
  await AsyncStorage.setItem(KEYS.RUN_HISTORY, JSON.stringify(filtered));
}

export async function getTerritories(): Promise<Territory[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TERRITORIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveTerritory(territory: Territory): Promise<void> {
  const territories = await getTerritories();
  territories.push(territory);
  await AsyncStorage.setItem(KEYS.TERRITORIES, JSON.stringify(territories));
}

export async function saveTerritories(territories: Territory[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TERRITORIES, JSON.stringify(territories));
}

export async function deleteTerritory(territoryId: string): Promise<void> {
  const territories = await getTerritories();
  const filtered = territories.filter((t) => t.id !== territoryId);
  await AsyncStorage.setItem(KEYS.TERRITORIES, JSON.stringify(filtered));
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_STATS);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export async function updateUserStats(run: RunHistoryItem, newTerritories: Territory[]): Promise<UserStats> {
  const stats = await getUserStats();
  stats.totalDistance += run.distance;
  stats.totalRuns += 1;
  stats.totalDuration += run.duration;
  stats.totalCalories += run.calories;
  stats.totalTerritories += newTerritories.length;
  stats.totalArea += newTerritories.reduce((sum, t) => sum + t.area, 0);
  if (run.distance > stats.longestRun) {
    stats.longestRun = run.distance;
  }
  const pace = run.duration > 0 && run.distance > 0 ? run.duration / 60 / (run.distance / 1000) : 0;
  if (pace > 0 && (stats.fastestPace === 0 || pace < stats.fastestPace)) {
    stats.fastestPace = pace;
  }
  await AsyncStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
  return stats;
}
