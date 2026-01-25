/**
 * Color scheme constants for EMS visualization
 */

/**
 * Metric type colors (semantic)
 */
export const METRIC_COLORS = {
  grid: {
    import: '#ef4444',      // Red - importing (consuming from grid)
    export: '#22c55e',      // Green - exporting (feeding to grid)
    balanced: '#94a3b8',    // Gray - balanced
  },
  solar: {
    primary: '#f59e0b',     // Amber - solar generation
    background: '#fef3c7',  // Light amber
  },
  consumption: {
    primary: '#3b82f6',     // Blue - consumption
    background: '#dbeafe',  // Light blue
  },
  storage: {
    charging: '#10b981',    // Emerald - charging
    discharging: '#f59e0b', // Amber - discharging
    idle: '#6b7280',        // Gray - idle
    background: '#d1fae5',  // Light emerald
  },
  efficiency: {
    high: '#22c55e',        // Green - high efficiency (>80%)
    medium: '#f59e0b',      // Amber - medium (50-80%)
    low: '#ef4444',         // Red - low (<50%)
  },
} as const;

/**
 * Status colors
 */
export const STATUS_COLORS = {
  online: '#22c55e',        // Green
  offline: '#6b7280',       // Gray
  warning: '#f59e0b',       // Amber
  error: '#ef4444',         // Red
} as const;

/**
 * Chart colors
 */
export const CHART_COLORS = {
  line: {
    grid: '#8b5cf6',        // Purple
    solar: '#f59e0b',       // Amber
    consumption: '#3b82f6', // Blue
    storage: '#10b981',     // Emerald
  },
  gradient: {
    grid: ['#8b5cf6', '#c084fc'],
    solar: ['#f59e0b', '#fbbf24'],
    consumption: ['#3b82f6', '#60a5fa'],
    storage: ['#10b981', '#34d399'],
  },
} as const;

/**
 * Get color based on value and thresholds
 */
export function getEfficiencyColor(percentage: number): string {
  if (percentage >= 80) return METRIC_COLORS.efficiency.high;
  if (percentage >= 50) return METRIC_COLORS.efficiency.medium;
  return METRIC_COLORS.efficiency.low;
}

/**
 * Get grid power color based on direction
 */
export function getGridColor(power: number): string {
  if (power > 5) return METRIC_COLORS.grid.import;
  if (power < -5) return METRIC_COLORS.grid.export;
  return METRIC_COLORS.grid.balanced;
}

/**
 * Get storage power color based on direction
 */
export function getStorageColor(power: number): string {
  if (power > 5) return METRIC_COLORS.storage.charging;
  if (power < -5) return METRIC_COLORS.storage.discharging;
  return METRIC_COLORS.storage.idle;
}
