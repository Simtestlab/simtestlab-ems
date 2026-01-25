/**
 * Custom Hook: Aggregated Metrics
 * Consolidates real-time metrics from all sites for dashboard display
 */

'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Space } from '@/domain/entities/space.entity';
import { RealtimeMetrics, TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';

/**
 * Aggregates metrics from multiple sites into a single consolidated view
 * Updates every 5 seconds to avoid annoying flickering in KPI cards
 */
export function useAggregatedMetrics(sites: Space[], updateInterval: number = 5000): RealtimeMetrics | null {
  const [throttledMetrics, setThrottledMetrics] = useState<RealtimeMetrics | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    if (!sites || sites.length === 0) return null;

    // Sum up all site metrics
    let totalSolarPower = 0;
    let totalSolarDaily = 0;
    let totalConsumption = 0;
    let totalBatteryPower = 0;
    let totalBatteryCapacity = 0;
    let totalBatterySocWeighted = 0;
    let avgEfficiency = 0;
    let avgBatteryTemp = 0;
    let sitesWithMetrics = 0;

    sites.forEach(site => {
      if (!site.metrics) return;
      
      sitesWithMetrics++;
      
      // Solar production (current power from all sites)
      totalSolarPower += site.metrics.currentPower || 0;
      
      // Estimate daily yield (simplified - assuming proportional to current power)
      // In real implementation, this would come from actual daily totals
      totalSolarDaily += (site.metrics.currentPower || 0) * 6; // Rough estimate
      
      // Battery metrics
      const siteCapacity = site.capacity.storage || 0;
      totalBatteryCapacity += siteCapacity;
      totalBatterySocWeighted += (site.metrics.soc || 0) * siteCapacity;
      
      // Battery power (positive = charging, negative = discharging)
      // Estimate based on SOC trend and solar availability
      const socDelta = (site.metrics.soc || 50) - 50; // Deviation from 50%
      const batteryPower = socDelta > 0 ? Math.abs(socDelta) * 0.5 : -Math.abs(socDelta) * 0.3;
      totalBatteryPower += batteryPower;
      
      // Average efficiency across sites
      avgEfficiency += site.metrics.efficiency || 0;
      
      // Battery temperature (average)
      avgBatteryTemp += 25 + (Math.random() - 0.5) * 10; // 20-30°C range
    });

    if (sitesWithMetrics === 0) return null;

    // Calculate weighted average SOC
    const avgSoc = totalBatteryCapacity > 0 
      ? totalBatterySocWeighted / totalBatteryCapacity 
      : 0;

    avgEfficiency /= sitesWithMetrics;
    avgBatteryTemp /= sitesWithMetrics;

    // Consumption estimation (typical: 70-80% of solar + battery discharge)
    totalConsumption = totalSolarPower * 0.75 + Math.abs(Math.min(0, totalBatteryPower));

    // Grid power calculation
    // Positive = importing from grid (consumption > generation)
    // Negative = exporting to grid (generation > consumption)
    const totalGeneration = totalSolarPower + Math.max(0, -totalBatteryPower);
    const gridPower = totalConsumption - totalGeneration;

    // Calculated metrics
    const autarchy = totalConsumption > 0 
      ? Math.min(100, (totalGeneration / totalConsumption) * 100)
      : 0;
    
    const selfConsumption = totalSolarPower > 0
      ? Math.min(100, (Math.min(totalSolarPower, totalConsumption) / totalSolarPower) * 100)
      : 0;

    const netEnergy = totalGeneration - totalConsumption;

    // Build consolidated metrics object
    const aggregatedMetrics: RealtimeMetrics = {
      timestamp: new Date(),
      grid: {
        activePower: gridPower,
        voltage: 230, // Typical grid voltage
        frequency: 50, // Typical grid frequency (50Hz in India)
        reactivePower: gridPower * 0.1, // Simplified
      },
      solar: {
        activePower: totalSolarPower,
        dailyYield: totalSolarDaily,
        efficiency: avgEfficiency,
        irradiance: totalSolarPower > 0 ? 800 : 100, // Estimated W/m²
      },
      consumption: {
        activePower: totalConsumption,
        breakdown: {
          hvac: totalConsumption * 0.4,
          lighting: totalConsumption * 0.2,
          equipment: totalConsumption * 0.3,
          other: totalConsumption * 0.1,
        },
      },
      storage: {
        activePower: totalBatteryPower,
        soc: avgSoc,
        capacity: totalBatteryCapacity,
        temperature: avgBatteryTemp,
        voltage: 48 * Math.ceil(totalBatteryCapacity / 10), // Estimated battery voltage
        current: totalBatteryPower > 0 ? totalBatteryPower / 48 : 0,
      },
      calculated: {
        autarchy,
        selfConsumption,
        netEnergy,
      },
    };

    return aggregatedMetrics;
  }, [sites]);

  // Throttle updates to avoid constant flickering
  useEffect(() => {
    const now = Date.now();
    
    // Update immediately on first render or after interval
    if (lastUpdateRef.current === 0 || now - lastUpdateRef.current >= updateInterval) {
      setThrottledMetrics(currentMetrics);
      lastUpdateRef.current = now;
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(() => {
      setThrottledMetrics(currentMetrics);
      lastUpdateRef.current = Date.now();
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [currentMetrics, updateInterval]);

  return throttledMetrics;
}

/**
 * Hook to build chart data from aggregated metrics history
 */
export function useAggregatedChartData(
  sites: Space[],
  maxDataPoints: number = 30
) {
  // This would need to maintain historical data
  // For now, returning empty structure
  // In full implementation, this would track metrics over time
  
  return useMemo(() => ({
    grid: [] as TimeSeriesDataPoint[],
    solar: [] as TimeSeriesDataPoint[],
    consumption: [] as TimeSeriesDataPoint[],
    storage: [] as TimeSeriesDataPoint[],
  }), [sites, maxDataPoints]);
}
