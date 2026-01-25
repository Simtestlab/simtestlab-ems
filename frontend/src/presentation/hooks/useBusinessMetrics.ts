/**
 * Custom Hook: Business Metrics (Low-Frequency Updates)
 * 
 * Purpose: Derived business and environmental KPIs
 * Update Rate: 5-15 minutes (or event-driven)
 * 
 * Use Cases:
 * - Peak Power (kW) - only updates when exceeded
 * - Cost Savings (₹) - calculated from energy using tariff rates
 * - Carbon Avoided (kg CO₂) - environmental impact metric
 * - System Health Score (%) - composite operational metric
 * - Active Alerts Count - aggregated from system conditions
 * 
 * Why This Frequency:
 * - These are strategic/business metrics, not operational telemetry
 * - Peak power only changes when a new peak is reached (event-driven)
 * - Cost/carbon calculated from accumulated energy (slow-changing)
 * - System health aggregates multiple factors (no need for real-time)
 * - Reduces cognitive load - dashboard feels stable, not chaotic
 * - Matches how facility managers actually use these metrics
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface BusinessMetrics {
  timestamp: Date;
  
  /** Peak power today (kW) - highest instantaneous power reading */
  peakPower: number;
  
  /** Time when peak occurred */
  peakPowerTime: Date | null;
  
  /** Cost savings today (₹) - based on solar generation */
  costSavings: number;
  
  /** Carbon emissions avoided today (kg CO₂) */
  carbonAvoided: number;
  
  /** System health score (0-100) - composite metric */
  systemHealth: number;
  
  /** Number of active alerts */
  activeAlerts: number;
  
  /** Alert severity breakdown */
  alertBreakdown: {
    critical: number;
    warning: number;
    info: number;
  };
  
  /** Performance index (0-100) - system performance vs expected */
  performanceIndex: number;
}

interface UseBusinessMetricsReturn {
  /** Current business metrics */
  metrics: BusinessMetrics | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Last update timestamp */
  lastUpdate: Date | null;
}

/**
 * Hook for low-frequency business and environmental metrics
 * 
 * @param updateInterval - Update frequency in ms (default: 300000 = 5 minutes)
 */
export function useBusinessMetrics(
  updateInterval: number = 300000
): UseBusinessMetricsReturn {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);
  
  // Track peak power (event-driven - only updates when exceeded)
  const peakTrackingRef = useRef({
    peakPower: 0,
    peakPowerTime: null as Date | null,
    dayStarted: new Date().getDate(),
  });

  /**
   * Calculate business metrics from current system state
   */
  const calculateBusinessMetrics = useCallback(async (): Promise<BusinessMetrics> => {
    // Import services
    const { metricsService } = await import('@/application/services/metrics.service');
    const currentMetrics = await metricsService.getCurrentMetrics();
    
    const peakTracking = peakTrackingRef.current;
    
    // Check if it's a new day - reset peak tracking
    const currentDay = new Date().getDate();
    if (peakTracking.dayStarted !== currentDay) {
      peakTracking.peakPower = 0;
      peakTracking.peakPowerTime = null;
      peakTracking.dayStarted = currentDay;
    }
    
    // Update peak power (event-driven logic)
    const currentPeak = Math.max(
      Math.abs(currentMetrics.grid.activePower),
      currentMetrics.solar.activePower,
      currentMetrics.consumption.activePower
    );
    
    if (currentPeak > peakTracking.peakPower) {
      peakTracking.peakPower = currentPeak;
      peakTracking.peakPowerTime = new Date();
    }
    
    // Calculate cost savings
    // Typical Indian tariff: ₹6.5/kWh for commercial
    const TARIFF_RATE = 6.5;
    const solarEnergyToday = currentMetrics.solar.dailyYield || 0;
    const costSavings = solarEnergyToday * TARIFF_RATE;
    
    // Calculate carbon avoided
    // India grid emission factor: ~0.82 kg CO₂/kWh
    const EMISSION_FACTOR = 0.82;
    const carbonAvoided = solarEnergyToday * EMISSION_FACTOR;
    
    // Calculate system health (composite metric)
    const soc = currentMetrics.storage.soc || 0;
    const efficiency = currentMetrics.solar.efficiency || 0;
    const autarchy = currentMetrics.calculated.autarchy || 0;
    
    // Weighted health score
    const systemHealth = (
      soc * 0.3 +           // 30% weight on battery health
      efficiency * 0.3 +     // 30% weight on efficiency
      autarchy * 0.4        // 40% weight on self-sufficiency
    );
    
    // Determine alerts based on system conditions
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;
    
    // Critical: Very low SOC
    if (soc < 15) {
      criticalAlerts++;
    }
    // Critical: Grid frequency out of range
    if (currentMetrics.grid.frequency < 49 || currentMetrics.grid.frequency > 51) {
      criticalAlerts++;
    }
    // Warning: Low SOC
    else if (soc < 30) {
      warningAlerts++;
    }
    
    // Warning: Low efficiency
    if (efficiency < 85) {
      warningAlerts++;
    }
    
    // Warning: High battery temperature
    const batteryTemp = currentMetrics.storage.temperature || 25;
    if (batteryTemp > 40) {
      warningAlerts++;
    }
    
    // Info: Low autarchy (grid-dependent)
    if (autarchy < 50) {
      infoAlerts++;
    }
    
    const activeAlerts = criticalAlerts + warningAlerts + infoAlerts;
    
    // Calculate performance index
    // Expected performance based on capacity and time of day
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    
    let expectedPerformance = 0;
    if (isDaytime) {
      // Expected solar production during daytime
      const solarCapacity = 1000; // Example: 1 MW capacity
      const timeOfDayFactor = Math.sin(((hour - 6) / 12) * Math.PI);
      const expectedSolar = solarCapacity * timeOfDayFactor * 0.8; // 80% of theoretical max
      
      const actualSolar = currentMetrics.solar.activePower;
      expectedPerformance = expectedSolar > 0 
        ? Math.min(100, (actualSolar / expectedSolar) * 100)
        : 0;
    } else {
      // Nighttime - evaluate based on battery efficiency
      expectedPerformance = efficiency;
    }
    
    return {
      timestamp: currentMetrics.timestamp,
      peakPower: peakTracking.peakPower,
      peakPowerTime: peakTracking.peakPowerTime,
      costSavings,
      carbonAvoided,
      systemHealth: Math.max(0, Math.min(100, systemHealth)),
      activeAlerts,
      alertBreakdown: {
        critical: criticalAlerts,
        warning: warningAlerts,
        info: infoAlerts,
      },
      performanceIndex: Math.max(0, Math.min(100, expectedPerformance)),
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial load
    calculateBusinessMetrics()
      .then((data) => {
        if (isMountedRef.current) {
          setMetrics(data);
          setLastUpdate(data.timestamp);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading business metrics:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });

    // Set up periodic updates (5-15 minutes)
    const intervalId = setInterval(() => {
      calculateBusinessMetrics()
        .then((data) => {
          if (isMountedRef.current) {
            setMetrics(data);
            setLastUpdate(data.timestamp);
          }
        })
        .catch((error) => {
          console.error('Error updating business metrics:', error);
        });
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [calculateBusinessMetrics, updateInterval]);

  return {
    metrics,
    isLoading,
    lastUpdate,
  };
}
