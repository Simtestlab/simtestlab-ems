/**
 * Custom Hook: Business Metrics from API
 * 
 * Fetches business KPIs from /api/ems/kpis
 * Update Rate: 60 seconds
 * 
 * Uses SWR for automatic revalidation
 */

'use client';

import useSWR from 'swr';

export interface BusinessMetrics {
  timestamp: Date;
  peakPower: number;
  peakPowerTime: Date | null;
  costSavings: number;
  carbonAvoided: number;
  systemHealth: number;
  activeAlerts: number;
  alertBreakdown: {
    critical: number;
    warning: number;
    info: number;
  };
  performanceIndex: number;
}

interface UseBusinessMetricsReturn {
  metrics: BusinessMetrics | null;
  isLoading: boolean;
  lastUpdate: Date | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for low-frequency business metrics from API
 */
export function useBusinessMetrics(
  updateInterval: number = 60000
): UseBusinessMetricsReturn {
  const { data, error, isLoading } = useSWR(
    '/api/ems/kpis',
    fetcher,
    {
      refreshInterval: updateInterval,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const isError = !!error;
  
  if (error) {
    console.error('[useBusinessMetrics] Error fetching data:', error);
  }

  const metrics: BusinessMetrics | null = data ? {
    timestamp: new Date(data.timestamp),
    peakPower: data.peakPower,
    peakPowerTime: null, // Not tracked separately yet
    costSavings: data.costSavings,
    carbonAvoided: data.carbonAvoided,
    systemHealth: 95, // Mock - not in API yet
    activeAlerts: data.activeSites, // Repurposed temporarily
    alertBreakdown: {
      critical: 0,
      warning: 0,
      info: 0,
    },
    performanceIndex: 92, // Mock
  } : null;

  return {
    metrics,
    isLoading: isLoading || !data,
    lastUpdate: metrics?.timestamp || null,
  };
}
