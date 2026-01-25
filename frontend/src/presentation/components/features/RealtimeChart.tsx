'use client';

import { useMemo } from 'react';
import { Line } from 'recharts';
import { LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';
import { formatPower } from '@/shared/utils/formatting';
import {
  MetricType,
  calculateYAxisDomain,
  calculateTimeWindow,
  formatTimeLabel,
  ANIMATION_CONFIG,
  getTooltipConfig,
} from '@/shared/utils/chart-config';

interface RealtimeChartProps {
  data: TimeSeriesDataPoint[];
  color: string;
  title: string;
  metricType: MetricType;
  unit?: string;
  timeWindow?: 'realtime' | 'recent' | 'extended';
}

/**
 * Professional EMS-Grade Real-Time Chart Component
 * 
 * INDUSTRIAL SCADA PRINCIPLES IMPLEMENTED:
 * 
 * 1. STABLE Y-AXIS
 *    - Engineering bounds prevent visual jumping
 *    - Dynamic expansion only when data exceeds expected range
 *    - Consistent scale across sessions
 * 
 * 2. CLEAR TIME DISPLAY
 *    - Sliding time window (60s default)
 *    - Reduced tick density (5-6 labels max)
 *    - HH:MM:SS format (SCADA standard)
 * 
 * 3. SMOOTH UPDATES
 *    - 400ms animation matches 2s telemetry rate
 *    - No axis jitter between updates
 *    - Predictable visual behavior
 * 
 * 4. ENGINEERING CONTEXT
 *    - Metric-specific ranges (grid bidirectional, solar unidirectional)
 *    - Appropriate precision for each value type
 *    - Clear units and labels
 */
export default function RealtimeChart({
  data,
  color,
  title,
  metricType,
  unit = 'kW',
  timeWindow = 'realtime',
}: RealtimeChartProps) {
  /**
   * SANITIZE INPUT DATA
   * Remove invalid values before any calculations
   */
  const sanitizedData = useMemo(() => {
    return data.filter(point => {
      // Remove invalid values
      if (!point || !point.timestamp || typeof point.value !== 'number') return false;
      if (!isFinite(point.value) || isNaN(point.value)) return false;
      
      // Remove extreme outliers (likely corruption)
      if (Math.abs(point.value) > 100000) return false;
      
      return true;
    });
  }, [data]);

  /**
   * PROFESSIONAL Y-AXIS: Stable Engineering Bounds
   * 
   * WHY: In real EMS/SCADA systems, axis jumping is distracting and 
   * prevents operators from quickly recognizing abnormal patterns.
   * 
   * SOLUTION: Use engineering-based domain that only expands for 
   * truly exceptional values, not normal fluctuations.
   */
  const yDomain = useMemo(() => {
    return calculateYAxisDomain(sanitizedData, metricType);
  }, [sanitizedData, metricType]);

  /**
   * PROFESSIONAL X-AXIS: Clean Time Window
   * 
   * WHY: Showing all timestamps creates visual noise and makes 
   * trends harder to read.
   * 
   * SOLUTION: 
   * - Fixed time window (60s, 120s, or 300s)
   * - Reduced tick count (5-6 labels)
   * - Proper spacing between labels
   */
  const { displayData, tickCount } = useMemo(() => {
    return calculateTimeWindow(sanitizedData, timeWindow);
  }, [sanitizedData, timeWindow]);

  /**
   * Transform data for Recharts with proper time formatting
   */
  const chartData = useMemo(() => {
    return displayData.map((point) => ({
      timestamp: point.timestamp.getTime(),
      value: point.value,
      time: formatTimeLabel(point.timestamp, 'time'),
      fullTimestamp: point.timestamp,
    }));
  }, [displayData]);

  /**
   * Tooltip configuration based on metric type
   */
  const tooltipConfig = useMemo(() => {
    return getTooltipConfig(metricType);
  }, [metricType]);

  /**
   * Calculate tick interval for X-axis
   * Show fewer ticks = clearer display
   */
  const xAxisInterval = useMemo(() => {
    if (chartData.length <= tickCount) return 0;
    return Math.floor(chartData.length / tickCount);
  }, [chartData.length, tickCount]);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          {/* Gradient fill for visual appeal */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Subtle grid for reference */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#000000" 
            opacity={0.1}
            vertical={false}
          />
          
          {/* PROFESSIONAL X-AXIS: Clean time display */}
          <XAxis
            dataKey="time"
            stroke="#000000"
            tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }}
            tickLine={{ stroke: '#000000' }}
            interval={xAxisInterval}
            minTickGap={40}
            padding={{ left: 10, right: 10 }}
            height={30}
          />
          
          {/* PROFESSIONAL Y-AXIS: Stable engineering bounds */}
          <YAxis
            stroke="#000000"
            tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }}
            tickLine={{ stroke: '#000000' }}
            width={40}
            domain={yDomain}
            tickCount={6}
            allowDataOverflow={false}
          />
          
          {/* Tooltip with proper formatting */}
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipConfig.backgroundColor,
              border: `1px solid ${tooltipConfig.borderColor}`,
              borderRadius: '6px',
              fontSize: '12px',
              color: '#000000',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            itemStyle={{ color: '#000000', fontWeight: 500 }}
            formatter={(value: number | undefined) => [
              formatPower(value ?? 0, tooltipConfig.precision), 
              `${title} (${tooltipConfig.unit})`
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0] && payload[0].payload.fullTimestamp) {
                return formatTimeLabel(payload[0].payload.fullTimestamp, 'full');
              }
              return `Time: ${label}`;
            }}
            labelStyle={{ color: '#000000', fontWeight: 'bold', marginBottom: '4px' }}
          />
          
          {/* 
            PROFESSIONAL LINE: Smooth animation, no dots
            
            WHY NO DOTS: In real SCADA/EMS systems, high-frequency telemetry
            (2s intervals) would create visual clutter with dots.
            
            ANIMATION: 400ms matches the 2s update rate - smooth but not distracting
          */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            fill={`url(#gradient-${color})`}
            animationDuration={ANIMATION_CONFIG.standard.duration}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
