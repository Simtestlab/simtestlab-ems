/**
 * Custom Hook: Live Telemetry from API
 * 
 * Fetches real-time power data from /api/ems/live
 * Update Rate: 2 seconds
 * 
 * Uses SWR for automatic revalidation and caching
 */

'use client';

import useSWR from 'swr';
import { TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';

export interface LiveTelemetry {
  timestamp: Date;
  gridPower: number;
  solarPower: number;
  consumptionPower: number;
  batteryPower: number;
  gridVoltage: number;
  gridFrequency: number;
  batteryTemperature: number;
  status: 'online' | 'offline' | 'warning';
}

export interface ChartData {
  grid: TimeSeriesDataPoint[];
  solar: TimeSeriesDataPoint[];
  consumption: TimeSeriesDataPoint[];
  storage: TimeSeriesDataPoint[];
}

interface UseLiveTelemetryReturn {
  telemetry: LiveTelemetry | null;
  chartData: ChartData;
  isLoading: boolean;
  lastUpdate: Date | null;
  error: any;
  isError: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for high-frequency live telemetry updates from API
 */
export function useLiveTelemetry(
  maxDataPoints: number = 30,
  updateInterval: number = 2000
): UseLiveTelemetryReturn {
  // Fetch live telemetry from API
  const { data, error, isLoading } = useSWR(
    '/api/ems/live',
    fetcher,
    {
      refreshInterval: updateInterval,
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  // Fetch chart data from API
  const { data: chartApiData, error: chartError } = useSWR(
    '/api/ems/charts',
    fetcher,
    {
      refreshInterval: 2000, // Charts update every 2 seconds (same as telemetry)
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  const isError = !!error || !!chartError;

  if (error) {
    console.error('[useLiveTelemetry] Error fetching live data:', error);
  }
  
  if (chartError) {
    console.error('[useLiveTelemetry] Error fetching chart data:', chartError);
  }

  // Transform API response to match expected format
  const telemetry: LiveTelemetry | null = data ? {
    timestamp: new Date(data.timestamp),
    gridPower: data.gridPower,
    solarPower: data.solarPower,
    consumptionPower: data.loadPower,
    batteryPower: data.batteryPower,
    gridVoltage: 400, // Mock - not in API yet
    gridFrequency: 50, // Mock - not in API yet
    batteryTemperature: 25, // Mock - not in API yet
    status: 'online',
  } : null;

  // Transform chart data - safely handle missing or incomplete data
  const chartData: ChartData = (chartApiData?.grid && chartApiData?.solar && chartApiData?.load && chartApiData?.battery) ? {
    grid: chartApiData.grid.map((p: any) => ({
      timestamp: new Date(p.timestamp),
      value: p.value,
    })),
    solar: chartApiData.solar.map((p: any) => ({
      timestamp: new Date(p.timestamp),
      value: p.value,
    })),
    consumption: chartApiData.load.map((p: any) => ({
      timestamp: new Date(p.timestamp),
      value: p.value,
    })),
    storage: chartApiData.battery.map((p: any) => ({
      timestamp: new Date(p.timestamp),
      value: p.value,
    })),
  } : {
    grid: [],
    solar: [],
    consumption: [],
    storage: [],
  };

  return {
    telemetry,
    chartData,
    isLoading: isLoading || !data,
    lastUpdate: telemetry?.timestamp || null,
    error: error || chartError,
    isError,
  };
}
