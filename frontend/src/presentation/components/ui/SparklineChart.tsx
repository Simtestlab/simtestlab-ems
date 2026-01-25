/**
 * Sparkline Chart Component
 * Displays a small inline chart for showing metric trends
 */

'use client';

import { useMemo } from 'react';
import { ChartDataPoint } from '@/presentation/hooks/useRealtimeSiteChartData';

interface SparklineChartProps {
  data: ChartDataPoint[];
  dataKey: 'power' | 'soc' | 'efficiency';
  height?: number;
  width?: number;
  color?: string;
  showGradient?: boolean;
  className?: string;
  label?: string;
  unit?: string;
}

export default function SparklineChart({
  data,
  dataKey,
  height = 60,
  width = 200,
  color = '#3b82f6',
  showGradient = true,
  className = '',
  label,
  unit,
}: SparklineChartProps) {
  const { path, minValue, maxValue, currentValue, gradientId } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', minValue: 0, maxValue: 0, currentValue: 0, gradientId: '' };
    }

    const values = data.map(d => d[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    // Create SVG path
    const padding = 4;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const stepX = chartWidth / (data.length - 1 || 1);

    const points = data.map((d, i) => {
      const x = padding + i * stepX;
      const normalizedValue = (d[dataKey] - min) / range;
      const y = padding + chartHeight - normalizedValue * chartHeight;
      return { x, y };
    });

    // Create smooth path using quadratic curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      const cpX = (prev.x + curr.x) / 2;
      pathData += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
    }

    // Create area path for gradient
    const areaPath = pathData + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const uniqueId = `gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      path: pathData,
      areaPath,
      minValue: min,
      maxValue: max,
      currentValue: values[values.length - 1],
      gradientId: uniqueId,
    };
  }, [data, dataKey, height, width]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <p className="text-xs text-gray-400">No data</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>
            {currentValue.toFixed(1)}{unit}
          </span>
        </div>
      )}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {showGradient && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          )}
        </defs>
        
        {/* Gradient area */}
        {showGradient && (
          <path
            d={useMemo(() => {
              const values = data.map(d => d[dataKey]);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              const padding = 4;
              const chartHeight = height - padding * 2;
              const chartWidth = width - padding * 2;
              const stepX = chartWidth / (data.length - 1 || 1);

              const points = data.map((d, i) => {
                const x = padding + i * stepX;
                const normalizedValue = (d[dataKey] - min) / range;
                const y = padding + chartHeight - normalizedValue * chartHeight;
                return { x, y };
              });

              let pathData = `M ${points[0].x} ${points[0].y}`;
              for (let i = 1; i < points.length; i++) {
                const curr = points[i];
                const prev = points[i - 1];
                const cpX = (prev.x + curr.x) / 2;
                pathData += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
              }

              return pathData + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
            }, [data, dataKey])}
            fill={`url(#${gradientId})`}
          />
        )}
        
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Current value dot */}
        <circle
          cx={useMemo(() => {
            const padding = 4;
            const chartWidth = width - padding * 2;
            return padding + chartWidth;
          }, [width])}
          cy={useMemo(() => {
            const values = data.map(d => d[dataKey]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || 1;
            const padding = 4;
            const chartHeight = height - padding * 2;
            const normalizedValue = (currentValue - min) / range;
            return padding + chartHeight - normalizedValue * chartHeight;
          }, [data, dataKey, currentValue, height])}
          r="3"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Min/Max labels */}
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>Min: {minValue.toFixed(1)}{unit}</span>
        <span>Max: {maxValue.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}
