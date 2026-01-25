/**
 * Custom Hook: Energy Metrics from API
 * 
 * Fetches accumulated energy metrics from /api/ems/kpis
 * Update Rate: 30 seconds
 * 
 * Uses SWR for automatic revalidation
 */

'use client';

import useSWR from 'swr';

export interface EnergyMetrics {
  timestamp: Date;
  energyToday: number;
  solarEnergyToday: number;
  gridImportToday: number;
  gridExportToday: number;
  batterySoc: number;
  batteryCapacity: number;
  selfConsumption: number;
  autarchy: number;
  netEnergy: number;
  averageEfficiency: number;
}

interface UseEnergyMetricsReturn {
  metrics: EnergyMetrics | null;
  isLoading: boolean;
  lastUpdate: Date | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for medium-frequency energy metrics from API
 */
export function useEnergyMetrics(
  updateInterval: number = 30000
): UseEnergyMetricsReturn {
  // Fetch from both endpoints
  const { data: kpiData, error: kpiError, isLoading: kpiLoading } = useSWR(
    '/api/ems/kpis',
    fetcher,
    {
      refreshInterval: updateInterval,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const { data: liveData, error: liveError } = useSWR(
    '/api/ems/live',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  if (kpiError || liveError) {
    console.error('[useEnergyMetrics] Error fetching data:', kpiError || liveError);
  }

  // Combine data from both endpoints
  const metrics: EnergyMetrics | null = (kpiData && liveData) ? {
    timestamp: new Date(kpiData.timestamp),
    energyToday: kpiData.energyToday,
    solarEnergyToday: kpiData.energyToday, // Simplified - using total
    gridImportToday: 0, // Not tracked separately yet
    gridExportToday: 0, // Not tracked separately yet
    batterySoc: liveData.batterySOC,
    batteryCapacity: 500, // Mock - hardcoded
    selfConsumption: 75, // Mock - calculated differently
    autarchy: 82, // Mock - calculated differently
    netEnergy: kpiData.energyToday * 0.8, // Mock approximation
    averageEfficiency: 94, // Mock
  } : null;

  return {
    metrics,
    isLoading: kpiLoading || !kpiData || !liveData,
    lastUpdate: metrics?.timestamp || null,
  };
}
