/**
 * Custom Hook: Real-time Site Chart Data from API
 * 
 * Fetches time-series data for site sparkline charts from API
 * Update Rate: 5 seconds
 */

'use client';

import useSWR from 'swr';
import { Space } from '@/domain/entities/space.entity';

export interface ChartDataPoint {
  timestamp: number;
  power: number;
  soc: number;
  efficiency: number;
}

export interface SiteChartData {
  siteId: string;
  dataPoints: ChartDataPoint[];
  trends: {
    power: 'up' | 'down' | 'stable';
    soc: 'up' | 'down' | 'stable';
    efficiency: 'up' | 'down' | 'stable';
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for real-time site chart data from API
 */
export function useRealtimeSiteChartData(site: Space | null): SiteChartData | null {
  const { data, error } = useSWR(
    site ? `/api/ems/sites/${site.id}/charts` : null,
    fetcher,
    {
      refreshInterval: 5000, // Update every 5 seconds
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  if (error) {
    console.error('[useRealtimeSiteChartData] Error fetching data:', error);
  }

  if (!data || !data.dataPoints || !data.trends) return null;

  // Transform API response
  return {
    siteId: data.siteId,
    dataPoints: data.dataPoints.map((p: any) => ({
      timestamp: new Date(p.timestamp).getTime(),
      power: p.power,
      soc: p.soc,
      efficiency: p.efficiency,
    })),
    trends: data.trends,
  };
}
