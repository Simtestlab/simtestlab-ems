/**
 * Custom Hook: Real-time Site Metrics
 * Provides live updates for map markers without affecting dashboard metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Space } from '@/domain/entities/space.entity';

interface SiteMetricsUpdate {
  siteId: string;
  currentPower: number;
  soc: number;
  efficiency: number;
  status: 'online' | 'offline' | 'warning' | 'error';
}

/**
 * Generate dynamic metrics for a single site
 */
function generateSiteMetrics(site: Space, baseTime: number): SiteMetricsUpdate {
  const capacity = site.capacity.solar;
  const basePower = site.metrics?.currentPower || 0;
  
  // Time-based solar curve (realistic sunrise to sunset)
  const hour = new Date(baseTime).getHours();
  const minute = new Date(baseTime).getMinutes();
  const timeDecimal = hour + minute / 60;
  
  // Solar production curve: 6 AM to 6 PM with peak at noon
  let solarFactor = 0;
  if (timeDecimal >= 6 && timeDecimal <= 18) {
    // Sine curve from sunrise (6) to sunset (18)
    const normalizedTime = (timeDecimal - 6) / 12; // 0 to 1
    solarFactor = Math.sin(normalizedTime * Math.PI);
    
    // Add cloud/weather variation (+/- 15%)
    const weatherVariation = 0.85 + Math.random() * 0.3;
    solarFactor *= weatherVariation;
  }
  
  // Calculate current power with realistic bounds
  const targetPower = capacity * solarFactor;
  
  // Smooth transition from previous value (simulates gradual changes)
  const transitionFactor = 0.7; // 70% new, 30% old
  const currentPower = Math.max(0, 
    transitionFactor * targetPower + (1 - transitionFactor) * basePower
  );
  
  // SOC simulation: charges during day, discharges at night
  const baseSoc = site.metrics?.soc || 50;
  let socChange = 0;
  
  if (solarFactor > 0.3 && baseSoc < 95) {
    // Charging during good solar production
    socChange = 0.5 + Math.random() * 1; // +0.5 to +1.5%
  } else if (solarFactor < 0.1 && baseSoc > 20) {
    // Discharging at night
    socChange = -(0.3 + Math.random() * 0.7); // -0.3 to -1%
  } else {
    // Stable with minor fluctuation
    socChange = (Math.random() - 0.5) * 0.3;
  }
  
  const soc = Math.max(10, Math.min(100, baseSoc + socChange));
  
  // Efficiency varies with load and temperature
  const baseEfficiency = site.metrics?.efficiency || 90;
  
  // Higher load = slightly better efficiency (up to a point)
  const loadFactor = currentPower / capacity;
  const efficiencyBonus = loadFactor > 0.2 ? Math.min(2, loadFactor * 3) : 0;
  
  // Random variation
  const efficiencyVariation = (Math.random() - 0.5) * 1.5;
  
  const efficiency = Math.max(85, Math.min(99, 
    baseEfficiency + efficiencyBonus + efficiencyVariation
  ));
  
  // Determine status based on multiple factors
  let status: 'online' | 'offline' | 'warning' | 'error' = 'online';
  
  // Low SOC warning
  if (soc < 25) {
    status = 'warning';
  }
  // Low efficiency warning
  else if (efficiency < 88) {
    status = 'warning';
  }
  // Unexpected low production during peak hours
  else if (timeDecimal >= 10 && timeDecimal <= 15 && currentPower < capacity * 0.3) {
    status = 'warning';
  }
  // Random fault (1% chance)
  else if (Math.random() < 0.01) {
    status = 'error';
  }
  
  return {
    siteId: site.id,
    currentPower: Number(currentPower.toFixed(1)),
    soc: Number(soc.toFixed(0)),
    efficiency: Number(efficiency.toFixed(1)),
    status,
  };
}

export function useRealtimeSiteMetrics(sites: Space[], updateInterval: number = 2000) {
  const [siteMetrics, setSiteMetrics] = useState<Map<string, SiteMetricsUpdate>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateMetrics = useCallback(() => {
    const now = Date.now();
    const newMetrics = new Map<string, SiteMetricsUpdate>();
    
    sites.forEach(site => {
      const metrics = generateSiteMetrics(site, now);
      newMetrics.set(site.id, metrics);
    });
    
    setSiteMetrics(newMetrics);
    setLastUpdate(new Date(now));
  }, [sites]);

  useEffect(() => {
    // Initial update
    updateMetrics();
    
    // Set up interval for periodic updates
    const interval = setInterval(updateMetrics, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateMetrics, updateInterval]);

  return { siteMetrics, lastUpdate };
}
