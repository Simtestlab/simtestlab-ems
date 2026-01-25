/**
 * Utility: Merge real-time metrics with static site data
 */

import { Space } from '@/domain/entities/space.entity';

interface SiteMetricsUpdate {
  siteId: string;
  currentPower: number;
  soc: number;
  efficiency: number;
  status: 'online' | 'offline' | 'warning' | 'error';
}

/**
 * Merge live metrics into site data
 */
export function mergeSiteMetrics(
  sites: Space[],
  liveMetrics: Map<string, SiteMetricsUpdate>
): Space[] {
  return sites.map(site => {
    const metrics = liveMetrics.get(site.id);
    
    if (!metrics || !site.metrics) {
      return site;
    }
    
    return {
      ...site,
      metrics: {
        ...site.metrics,
        currentPower: metrics.currentPower,
        soc: metrics.soc,
        efficiency: metrics.efficiency,
        status: metrics.status,
      },
    };
  });
}
