/**
 * Hook to track real-time site metrics history for sparkline charts
 * Maintains a sliding window of data points (30 minutes at 2-second intervals)
 */

import { useState, useEffect, useRef } from 'react';
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

const MAX_DATA_POINTS = 90; // 30 minutes at 2-second intervals (900 / 2 = 450, but we'll use 90 for performance)
const TREND_THRESHOLD = 2; // Percentage change to consider as trending

function calculateTrend(dataPoints: ChartDataPoint[], key: keyof Omit<ChartDataPoint, 'timestamp'>): 'up' | 'down' | 'stable' {
  if (dataPoints.length < 10) return 'stable';
  
  // Compare recent average (last 10 points) to earlier average (10 points before that)
  const recentPoints = dataPoints.slice(-10);
  const earlierPoints = dataPoints.slice(-20, -10);
  
  const recentAvg = recentPoints.reduce((sum, p) => sum + p[key], 0) / recentPoints.length;
  const earlierAvg = earlierPoints.reduce((sum, p) => sum + p[key], 0) / earlierPoints.length;
  
  const percentChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  
  if (percentChange > TREND_THRESHOLD) return 'up';
  if (percentChange < -TREND_THRESHOLD) return 'down';
  return 'stable';
}

export function useRealtimeSiteChartData(site: Space | null): SiteChartData | null {
  const [chartData, setChartData] = useState<SiteChartData | null>(null);
  const dataPointsRef = useRef<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!site) {
      setChartData(null);
      dataPointsRef.current = [];
      return;
    }

    // Add new data point
    const newPoint: ChartDataPoint = {
      timestamp: Date.now(),
      power: site.metrics?.currentPower || 0,
      soc: site.metrics?.soc || 0,
      efficiency: site.metrics?.efficiency || 0,
    };

    // Update data points with sliding window
    const updatedPoints = [...dataPointsRef.current, newPoint];
    if (updatedPoints.length > MAX_DATA_POINTS) {
      updatedPoints.shift(); // Remove oldest point
    }
    dataPointsRef.current = updatedPoints;

    // Calculate trends
    const trends = {
      power: calculateTrend(updatedPoints, 'power'),
      soc: calculateTrend(updatedPoints, 'soc'),
      efficiency: calculateTrend(updatedPoints, 'efficiency'),
    };

    setChartData({
      siteId: site.id,
      dataPoints: updatedPoints,
      trends,
    });
  }, [site, site?.metrics?.currentPower, site?.metrics?.soc, site?.metrics?.efficiency]);

  // Reset when site changes
  useEffect(() => {
    dataPointsRef.current = [];
  }, [site?.id]);

  return chartData;
}
