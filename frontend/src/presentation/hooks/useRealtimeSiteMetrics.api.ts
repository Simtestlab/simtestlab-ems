/**
 * Custom Hook: Real-time Site Metrics from API
 * 
 * Fetches live site-level metrics from /api/ems/sites
 * Update Rate: 2-5 seconds
 */

'use client';

import useSWR from 'swr';
import { Space } from '@/domain/entities/space.entity';

export interface SiteMetricsUpdate {
  siteId: string;
  currentPower: number;
  soc: number;
  efficiency: number;
  status: 'online' | 'offline' | 'warning' | 'error';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for real-time site metrics from API
 */
export function useRealtimeSiteMetrics(
  sites: Space[],
  updateInterval: number = 2000
) {
  const { data, error } = useSWR(
    '/api/ems/sites',
    fetcher,
    {
      refreshInterval: updateInterval,
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  if (error) {
    console.error('[useRealtimeSiteMetrics] Error fetching data:', error);
  }

  // Transform API response to match expected format (Map)
  const siteMetrics = new Map<string, SiteMetricsUpdate>();
  
  if (data?.sites) {
    data.sites.forEach((site: any) => {
      siteMetrics.set(site.siteId, {
        siteId: site.siteId,
        currentPower: site.currentPower,
        soc: site.soc,
        efficiency: site.efficiency,
        status: site.status,
      });
    });
  }

  return {
    siteMetrics,
    lastUpdate: data?.timestamp ? new Date(data.timestamp) : null,
  };
}
