/**
 * Professional EMS Chart Configuration
 * 
 * This module implements industrial SCADA/EMS best practices for time-series visualization:
 * 
 * KEY PRINCIPLES:
 * 1. Stable Y-Axis: Engineering bounds prevent visual jumping
 * 2. Clear Time Windows: Human-readable intervals (60s, 120s, 300s)
 * 3. Reduced Tick Density: No more than 5-7 X-axis labels
 * 4. Smooth Updates: Animation timing matches telemetry rate
 * 5. Engineering Context: Domain-specific ranges for each metric type
 */

import { TimeSeriesDataPoint } from '@/domain/entities/metrics.entity';

/**
 * Metric Types with Engineering Characteristics
 */
export type MetricType = 
  | 'grid'           // Bidirectional: -500 to +500 kW typical
  | 'solar'          // Unidirectional: 0 to 300 kW typical
  | 'consumption'    // Unidirectional: 0 to 400 kW typical
  | 'storage'        // Bidirectional: -200 to +200 kW typical
  | 'soc'            // Percentage: 0 to 100%
  | 'voltage'        // Voltage: 380 to 420V typical
  | 'frequency';     // Frequency: 49.5 to 50.5 Hz typical

/**
 * Engineering Bounds for Each Metric Type
 * These define the "normal operating range" for stable Y-axis display
 */
export const ENGINEERING_BOUNDS: Record<MetricType, { min: number; max: number; buffer: number }> = {
  grid: {
    min: -600,        // Max export capacity
    max: 600,         // Max import capacity
    buffer: 0.05,     // 5% headroom
  },
  solar: {
    min: -10,         // Small negative for visual breathing room
    max: 1600,        // Peak solar capacity (1500kW + buffer)
    buffer: 0.10,     // 10% headroom
  },
  consumption: {
    min: 0,           // Never negative
    max: 1200,        // Peak consumption capacity
    buffer: 0.10,     // 10% headroom
  },
  storage: {
    min: -250,        // Max discharge rate
    max: 250,         // Max charge rate
    buffer: 0.05,     // 5% headroom
  },
  soc: {
    min: 0,
    max: 100,
    buffer: 0,        // No buffer for percentages
  },
  voltage: {
    min: 370,
    max: 430,
    buffer: 0.02,     // 2% headroom
  },
  frequency: {
    min: 49.0,
    max: 51.0,
    buffer: 0.02,     // 2% headroom
  },
};

/**
 * Time Window Configuration for Different Chart Types
 */
export interface TimeWindowConfig {
  duration: number;        // Total time span in seconds
  maxPoints: number;       // Maximum data points to display
  tickInterval: number;    // Seconds between X-axis ticks
  labelFormat: 'time' | 'relative' | 'full';
}

export const TIME_WINDOWS: Record<string, TimeWindowConfig> = {
  // Short-term: High-resolution for live monitoring
  realtime: {
    duration: 60,          // 1 minute window
    maxPoints: 30,         // 2-second intervals
    tickInterval: 15,      // Label every 15 seconds
    labelFormat: 'time',
  },
  
  // Medium-term: Balanced view for trend analysis
  recent: {
    duration: 120,         // 2 minute window
    maxPoints: 60,         // 2-second intervals
    tickInterval: 30,      // Label every 30 seconds
    labelFormat: 'time',
  },
  
  // Long-term: Overview for pattern recognition
  extended: {
    duration: 300,         // 5 minute window
    maxPoints: 150,        // 2-second intervals
    tickInterval: 60,      // Label every 1 minute
    labelFormat: 'relative',
  },
};

/**
 * Sanitize data values to remove invalid or extreme outliers
 * 
 * CRITICAL: Prevents chart axis from showing unrealistic scales
 * due to NaN, Infinity, or corrupted data points
 */
function sanitizeDataValues(
  values: number[],
  metricType: MetricType
): number[] {
  const bounds = ENGINEERING_BOUNDS[metricType];
  
  // Maximum allowed deviation from engineering bounds (10x)
  const maxDeviation = 10;
  const absoluteMin = bounds.min * maxDeviation;
  const absoluteMax = bounds.max * maxDeviation;
  
  return values.filter(v => {
    // Remove invalid values
    if (!isFinite(v)) return false;
    if (isNaN(v)) return false;
    
    // Remove extreme outliers (likely data corruption)
    if (v < absoluteMin || v > absoluteMax) return false;
    
    return true;
  });
}

/**
 * Calculate Stable Y-Axis Domain
 * 
 * INDUSTRIAL LOGIC:
 * 1. Use engineering bounds as baseline
 * 2. Dynamically expand only if data exceeds bounds
 * 3. Add buffer headroom for visual clarity
 * 4. Prevent domain from collapsing to single value
 * 5. Sanitize data to remove invalid/extreme values
 * 
 * This prevents axis "jumping" which causes visual instability
 */
export function calculateYAxisDomain(
  data: TimeSeriesDataPoint[],
  metricType: MetricType
): [number, number] {
  const bounds = ENGINEERING_BOUNDS[metricType];
  
  // Start with engineering bounds
  let domainMin = bounds.min;
  let domainMax = bounds.max;
  
  if (data.length === 0) {
    return [domainMin, domainMax];
  }
  
  // Extract and sanitize values
  const rawValues = data.map(d => d.value);
  const values = sanitizeDataValues(rawValues, metricType);
  
  // If no valid values after sanitization, use engineering bounds
  if (values.length === 0) {
    console.warn(`[Chart] No valid data for ${metricType}, using engineering bounds`);
    return [domainMin, domainMax];
  }
  
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  
  // Expand domain if data exceeds engineering bounds
  if (dataMin < domainMin) {
    const expansion = Math.abs(dataMin - domainMin);
    domainMin = dataMin - (expansion * bounds.buffer);
  }
  
  if (dataMax > domainMax) {
    const expansion = Math.abs(dataMax - domainMax);
    domainMax = dataMax + (expansion * bounds.buffer);
  }
  
  // Ensure minimum range to prevent visual collapse
  const range = domainMax - domainMin;
  const minRange = (bounds.max - bounds.min) * 0.1; // At least 10% of engineering range
  
  if (range < minRange) {
    const center = (domainMin + domainMax) / 2;
    domainMin = center - (minRange / 2);
    domainMax = center + (minRange / 2);
  }
  
  return [domainMin, domainMax];
}

/**
 * Calculate Time Window for X-Axis
 * 
 * Returns data points within the specified time window
 * and provides tick configuration for clean axis labels
 */
export function calculateTimeWindow(
  data: TimeSeriesDataPoint[],
  windowType: keyof typeof TIME_WINDOWS = 'realtime'
): {
  displayData: TimeSeriesDataPoint[];
  tickCount: number;
  tickInterval: number;
} {
  const config = TIME_WINDOWS[windowType];
  
  if (data.length === 0) {
    return {
      displayData: [],
      tickCount: 5,
      tickInterval: config.tickInterval,
    };
  }
  
  // Get most recent timestamp
  const latestTime = data[data.length - 1].timestamp.getTime();
  const windowStart = latestTime - (config.duration * 1000);
  
  // Filter data within time window
  const displayData = data.filter(
    point => point.timestamp.getTime() >= windowStart
  );
  
  // Limit to maxPoints (decimation if needed)
  const finalData = displayData.length > config.maxPoints
    ? decimateData(displayData, config.maxPoints)
    : displayData;
  
  // Calculate tick count (5-7 is optimal for readability)
  const tickCount = Math.min(
    Math.floor(config.duration / config.tickInterval),
    7
  );
  
  return {
    displayData: finalData,
    tickCount,
    tickInterval: config.tickInterval,
  };
}

/**
 * Decimate time-series data while preserving shape
 * 
 * Uses largest-triangle-three-buckets algorithm simplified
 * This maintains visual fidelity while reducing point count
 */
function decimateData(
  data: TimeSeriesDataPoint[],
  targetPoints: number
): TimeSeriesDataPoint[] {
  if (data.length <= targetPoints) return data;
  
  const bucketSize = Math.floor(data.length / targetPoints);
  const decimated: TimeSeriesDataPoint[] = [];
  
  // Always keep first point
  decimated.push(data[0]);
  
  // Bucket the middle points
  for (let i = 1; i < targetPoints - 1; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = Math.min((i + 1) * bucketSize, data.length);
    
    // Find point with max value in bucket (preserves peaks)
    let maxPoint = data[bucketStart];
    let maxValue = Math.abs(data[bucketStart].value);
    
    for (let j = bucketStart; j < bucketEnd; j++) {
      const absValue = Math.abs(data[j].value);
      if (absValue > maxValue) {
        maxValue = absValue;
        maxPoint = data[j];
      }
    }
    
    decimated.push(maxPoint);
  }
  
  // Always keep last point
  decimated.push(data[data.length - 1]);
  
  return decimated;
}

/**
 * Format Time for X-Axis Labels
 * 
 * SCADA CONVENTION: HH:MM:SS for absolute time
 */
export function formatTimeLabel(timestamp: Date, format: 'time' | 'relative' | 'full' = 'time'): string {
  if (format === 'time') {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
  
  if (format === 'relative') {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Animation Configuration
 * 
 * PRINCIPLE: Match animation duration to update frequency
 * - 2s telemetry rate → 300-500ms animation
 * - Smooth but not distracting
 * - Disable on very high frequencies (< 1s)
 */
export const ANIMATION_CONFIG = {
  // For 2-second telemetry updates
  standard: {
    duration: 400,          // 400ms transition
    easing: 'ease-in-out',
  },
  
  // For slower metrics (30s, 5min)
  slow: {
    duration: 800,
    easing: 'ease-in-out',
  },
  
  // Disable for very fast updates
  none: {
    duration: 0,
    easing: 'linear',
  },
};

/**
 * Chart Update Discipline
 * 
 * Separates visual update rates from data acquisition rates
 * This prevents "flickering KPIs" while maintaining responsive charts
 */
export interface UpdateRateConfig {
  telemetry: number;      // High-frequency live data (1-2s)
  energy: number;         // Medium-frequency aggregated (30s)
  business: number;       // Low-frequency strategic (5min)
  visual: number;         // Visual refresh rate (may differ from data rate)
}

export const UPDATE_RATES: UpdateRateConfig = {
  telemetry: 2000,        // 2 seconds - for charts and live power displays
  energy: 30000,          // 30 seconds - for energy totals, SOC, efficiency
  business: 300000,       // 5 minutes - for peak power, costs, health scores
  visual: 500,            // 500ms - smooth visual transitions (independent of data)
};

/**
 * Tooltip Configuration for Professional EMS Display
 */
export interface TooltipConfig {
  precision: number;
  unit: string;
  showTimestamp: boolean;
  backgroundColor: string;
  borderColor: string;
}

export function getTooltipConfig(metricType: MetricType): TooltipConfig {
  const configs: Record<MetricType, TooltipConfig> = {
    grid: {
      precision: 1,
      unit: 'kW',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    solar: {
      precision: 1,
      unit: 'kW',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    consumption: {
      precision: 1,
      unit: 'kW',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    storage: {
      precision: 1,
      unit: 'kW',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    soc: {
      precision: 0,
      unit: '%',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    voltage: {
      precision: 1,
      unit: 'V',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    frequency: {
      precision: 2,
      unit: 'Hz',
      showTimestamp: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
  };
  
  return configs[metricType];
}
