/**
 * Custom Hook: Live Telemetry (High-Frequency Updates)
 * 
 * Purpose: Real-time power monitoring for live dashboard feel
 * Update Rate: 1-2 seconds
 * 
 * Use Cases:
 * - Instantaneous power readings (kW)
 * - Real-time charts with rolling windows
 * - Status indicators (online/offline)
 * - Current flows in energy diagrams
 * 
 * Why This Frequency:
 * - Matches SCADA/EMS industry standards for telemetry
 * - Provides responsive UI without overwhelming updates
 * - Aligns with typical grid sampling rates (1-2Hz)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';

export interface LiveTelemetry {
  timestamp: Date;
  
  /** Grid power (kW) - positive = import, negative = export */
  gridPower: number;
  
  /** Solar generation power (kW) */
  solarPower: number;
  
  /** Total consumption power (kW) */
  consumptionPower: number;
  
  /** Battery power (kW) - positive = charging, negative = discharging */
  batteryPower: number;
  
  /** Grid voltage (V) */
  gridVoltage: number;
  
  /** Grid frequency (Hz) */
  gridFrequency: number;
  
  /** Battery temperature (°C) */
  batteryTemperature: number;
  
  /** Connection status */
  status: 'online' | 'offline' | 'warning';
}

export interface ChartData {
  grid: TimeSeriesDataPoint[];
  solar: TimeSeriesDataPoint[];
  consumption: TimeSeriesDataPoint[];
  storage: TimeSeriesDataPoint[];
}

interface UseLiveTelemetryReturn {
  /** Current live readings */
  telemetry: LiveTelemetry | null;
  
  /** Historical data for charts */
  chartData: ChartData;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Last update timestamp */
  lastUpdate: Date | null;
}

/**
 * Hook for high-frequency live telemetry updates
 * 
 * @param maxDataPoints - Maximum points to keep in chart history (default: 30)
 * @param updateInterval - Update frequency in ms (default: 2000 = 2 seconds)
 */
export function useLiveTelemetry(
  maxDataPoints: number = 30,
  updateInterval: number = 2000
): UseLiveTelemetryReturn {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    grid: [],
    solar: [],
    consumption: [],
    storage: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  /**
   * Add new telemetry point and update chart data
   */
  const addTelemetryPoint = useCallback((newTelemetry: LiveTelemetry) => {
    if (!isMountedRef.current) return;
    
    setTelemetry(newTelemetry);
    setLastUpdate(newTelemetry.timestamp);
    
    // Update chart data with rolling window
    setChartData((prev) => {
      const addPoint = (arr: TimeSeriesDataPoint[], value: number) => {
        const newArr = [
          ...arr,
          { timestamp: newTelemetry.timestamp, value },
        ];
        // Keep only the last N points
        return newArr.slice(-maxDataPoints);
      };

      return {
        grid: addPoint(prev.grid, newTelemetry.gridPower),
        solar: addPoint(prev.solar, newTelemetry.solarPower),
        consumption: addPoint(prev.consumption, newTelemetry.consumptionPower),
        storage: addPoint(prev.storage, newTelemetry.batteryPower),
      };
    });
  }, [maxDataPoints]);

  /**
   * Fetch telemetry from service/mock
   */
  const fetchTelemetry = useCallback(async (): Promise<LiveTelemetry> => {
    // This will be replaced with actual API call
    // For now, import from the metrics service adapter
    const { metricsService } = await import('@/application/services/metrics.service');
    const metrics = await metricsService.getCurrentMetrics();
    
    return {
      timestamp: metrics.timestamp,
      gridPower: metrics.grid.activePower,
      solarPower: metrics.solar.activePower,
      consumptionPower: metrics.consumption.activePower,
      batteryPower: metrics.storage.activePower,
      gridVoltage: metrics.grid.voltage,
      gridFrequency: metrics.grid.frequency,
      batteryTemperature: metrics.storage.temperature || 25,
      status: 'online',
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial load
    fetchTelemetry()
      .then((data) => {
        if (isMountedRef.current) {
          addTelemetryPoint(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading initial telemetry:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });

    // Set up periodic updates
    const intervalId = setInterval(() => {
      fetchTelemetry()
        .then((data) => {
          if (isMountedRef.current) {
            addTelemetryPoint(data);
          }
        })
        .catch((error) => {
          console.error('Error updating telemetry:', error);
        });
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchTelemetry, addTelemetryPoint, updateInterval]);

  return {
    telemetry,
    chartData,
    isLoading,
    lastUpdate,
  };
}
