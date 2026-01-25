/**
 * Custom Hook: Energy Metrics (Medium-Frequency Updates)
 * 
 * Purpose: Aggregated operational metrics and energy accumulation
 * Update Rate: 30-60 seconds
 * 
 * Use Cases:
 * - Energy Today (kWh) - integrated from power over time
 * - Battery State of Charge (SOC %)
 * - Site-level energy totals
 * - Cumulative production/consumption
 * 
 * Why This Frequency:
 * - Energy values accumulate slowly (integration of power)
 * - Prevents annoying flicker in KPI cards
 * - Matches typical EMS energy meter reporting intervals
 * - SOC changes are gradual, not instantaneous
 * - Reduces unnecessary re-renders
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface EnergyMetrics {
  timestamp: Date;
  
  /** Total energy consumed today (kWh) */
  energyToday: number;
  
  /** Total solar energy generated today (kWh) */
  solarEnergyToday: number;
  
  /** Total grid import today (kWh) */
  gridImportToday: number;
  
  /** Total grid export today (kWh) */
  gridExportToday: number;
  
  /** Battery state of charge (%) */
  batterySoc: number;
  
  /** Battery capacity (kWh) */
  batteryCapacity: number;
  
  /** Self-consumption ratio (%) - solar energy used locally */
  selfConsumption: number;
  
  /** Autarchy ratio (%) - consumption covered by own generation */
  autarchy: number;
  
  /** Net energy balance (kWh) - positive = surplus, negative = deficit */
  netEnergy: number;
  
  /** Average efficiency (%) */
  averageEfficiency: number;
}

interface UseEnergyMetricsReturn {
  /** Current energy metrics */
  metrics: EnergyMetrics | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Last update timestamp */
  lastUpdate: Date | null;
}

/**
 * Hook for medium-frequency energy accumulation metrics
 * 
 * @param updateInterval - Update frequency in ms (default: 30000 = 30 seconds)
 */
export function useEnergyMetrics(
  updateInterval: number = 30000
): UseEnergyMetricsReturn {
  const [metrics, setMetrics] = useState<EnergyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);
  
  // Track accumulated energy internally for realistic integration
  const accumulatorRef = useRef({
    energyToday: 0,
    solarEnergyToday: 0,
    gridImportToday: 0,
    gridExportToday: 0,
    lastTimestamp: Date.now(),
    dayStarted: new Date().getDate(),
  });

  /**
   * Fetch current energy metrics and integrate power to energy
   */
  const fetchEnergyMetrics = useCallback(async (): Promise<EnergyMetrics> => {
    const { metricsService } = await import('@/application/services/metrics.service');
    const currentMetrics = await metricsService.getCurrentMetrics();
    
    const now = Date.now();
    const accumulator = accumulatorRef.current;
    
    // Check if it's a new day - reset daily counters
    const currentDay = new Date().getDate();
    if (accumulator.dayStarted !== currentDay) {
      accumulator.energyToday = 0;
      accumulator.solarEnergyToday = 0;
      accumulator.gridImportToday = 0;
      accumulator.gridExportToday = 0;
      accumulator.dayStarted = currentDay;
    }
    
    // Calculate time delta in hours for energy integration
    const deltaTimeHours = (now - accumulator.lastTimestamp) / (1000 * 60 * 60);
    
    // Integrate power to energy (Power [kW] * Time [h] = Energy [kWh])
    const solarEnergyDelta = currentMetrics.solar.activePower * deltaTimeHours;
    const consumptionEnergyDelta = currentMetrics.consumption.activePower * deltaTimeHours;
    
    // Grid: separate import and export
    const gridPower = currentMetrics.grid.activePower;
    const gridEnergyDelta = Math.abs(gridPower) * deltaTimeHours;
    
    if (gridPower > 0) {
      // Importing from grid
      accumulator.gridImportToday += gridEnergyDelta;
    } else if (gridPower < 0) {
      // Exporting to grid
      accumulator.gridExportToday += gridEnergyDelta;
    }
    
    // Accumulate energy totals
    accumulator.solarEnergyToday += solarEnergyDelta;
    accumulator.energyToday += consumptionEnergyDelta;
    accumulator.lastTimestamp = now;
    
    // Calculate derived metrics
    const selfConsumption = accumulator.solarEnergyToday > 0
      ? Math.min(100, (Math.min(accumulator.solarEnergyToday, accumulator.energyToday) / accumulator.solarEnergyToday) * 100)
      : 0;
    
    const totalGeneration = accumulator.solarEnergyToday;
    const autarchy = accumulator.energyToday > 0
      ? Math.min(100, (totalGeneration / accumulator.energyToday) * 100)
      : 0;
    
    const netEnergy = totalGeneration - accumulator.energyToday;
    
    return {
      timestamp: currentMetrics.timestamp,
      energyToday: accumulator.energyToday,
      solarEnergyToday: accumulator.solarEnergyToday,
      gridImportToday: accumulator.gridImportToday,
      gridExportToday: accumulator.gridExportToday,
      batterySoc: currentMetrics.storage.soc || 0,
      batteryCapacity: currentMetrics.storage.capacity || 0,
      selfConsumption,
      autarchy,
      netEnergy,
      averageEfficiency: currentMetrics.solar.efficiency || 0,
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial load
    fetchEnergyMetrics()
      .then((data) => {
        if (isMountedRef.current) {
          setMetrics(data);
          setLastUpdate(data.timestamp);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading energy metrics:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });

    // Set up periodic updates (30-60 seconds)
    const intervalId = setInterval(() => {
      fetchEnergyMetrics()
        .then((data) => {
          if (isMountedRef.current) {
            setMetrics(data);
            setLastUpdate(data.timestamp);
          }
        })
        .catch((error) => {
          console.error('Error updating energy metrics:', error);
        });
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchEnergyMetrics, updateInterval]);

  return {
    metrics,
    isLoading,
    lastUpdate,
  };
}
