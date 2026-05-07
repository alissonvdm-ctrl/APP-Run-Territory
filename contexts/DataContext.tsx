import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { RunHistoryItem, Territory, UserStats } from '@/lib/types';
import * as Storage from '@/lib/storage';

interface DataContextValue {
  runs: RunHistoryItem[];
  territories: Territory[];
  stats: UserStats;
  isLoading: boolean;
  addRun: (run: RunHistoryItem, newTerritories: Territory[]) => Promise<void>;
  removeRun: (runId: string) => Promise<void>;
  addTerritory: (territory: Territory) => Promise<void>;
  removeTerritory: (territoryId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<RunHistoryItem[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalDistance: 0,
    totalRuns: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalTerritories: 0,
    totalArea: 0,
    longestRun: 0,
    fastestPace: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [runData, territoryData, statsData] = await Promise.all([
        Storage.getRunHistory(),
        Storage.getTerritories(),
        Storage.getUserStats(),
      ]);
      setRuns(runData);
      setTerritories(territoryData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addRun = useCallback(async (run: RunHistoryItem, newTerritories: Territory[]) => {
    await Storage.saveRun(run);
    for (const t of newTerritories) {
      await Storage.saveTerritory(t);
    }
    const updatedStats = await Storage.updateUserStats(run, newTerritories);
    setRuns((prev) => [run, ...prev]);
    setTerritories((prev) => [...prev, ...newTerritories]);
    setStats(updatedStats);
  }, []);

  const removeRun = useCallback(async (runId: string) => {
    await Storage.deleteRun(runId);
    setRuns((prev) => prev.filter((r) => r.id !== runId));
  }, []);

  const addTerritory = useCallback(async (territory: Territory) => {
    await Storage.saveTerritory(territory);
    setTerritories((prev) => [...prev, territory]);
  }, []);

  const removeTerritory = useCallback(async (territoryId: string) => {
    await Storage.deleteTerritory(territoryId);
    setTerritories((prev) => prev.filter((t) => t.id !== territoryId));
  }, []);

  const value = useMemo(
    () => ({ runs, territories, stats, isLoading, addRun, removeRun, addTerritory, removeTerritory, refreshData }),
    [runs, territories, stats, isLoading, addRun, removeRun, addTerritory, removeTerritory, refreshData]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
