'use client';

import { useState, useEffect, useCallback } from 'react';
import { RealtimeMetrics, TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';
import { metricsService } from '@/application/services/metrics.service';

interface ChartData {
  grid: TimeSeriesDataPoint[];
  solar: TimeSeriesDataPoint[];
  consumption: TimeSeriesDataPoint[];
  storage: TimeSeriesDataPoint[];
}

export function useRealtimeMetrics(maxDataPoints: number = 30) {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    grid: [],
    solar: [],
    consumption: [],
    storage: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const addDataPoint = useCallback((newMetrics: RealtimeMetrics) => {
    setMetrics(newMetrics);
    
    setChartData((prev) => {
      const addPoint = (arr: TimeSeriesDataPoint[], value: number) => {
        const newArr = [
          ...arr,
          { timestamp: newMetrics.timestamp, value },
        ];
        return newArr.slice(-maxDataPoints);
      };

      return {
        grid: addPoint(prev.grid, newMetrics.grid.activePower),
        solar: addPoint(prev.solar, newMetrics.solar.activePower),
        consumption: addPoint(prev.consumption, newMetrics.consumption.activePower),
        storage: addPoint(prev.storage, newMetrics.storage.activePower),
      };
    });
  }, [maxDataPoints]);

  useEffect(() => {
    // Initial load
    metricsService.getCurrentMetrics().then((data) => {
      addDataPoint(data);
      setIsLoading(false);
    });

    // Subscribe to updates
    const unsubscribe = metricsService.subscribeToRealtimeMetrics((data) => {
      addDataPoint(data);
    });

    return () => unsubscribe();
  }, [addDataPoint]);

  return { metrics, chartData, isLoading };
}
