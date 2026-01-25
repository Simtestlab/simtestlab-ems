/**
 * Utility functions for value formatting
 */

/**
 * Format power value with appropriate unit
 */
export function formatPower(value: number, decimals: number = 1): string {
  const abs = Math.abs(value);
  
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(decimals)} MW`;
  }
  
  return `${value.toFixed(decimals)} kW`;
}

/**
 * Format energy value with appropriate unit
 */
export function formatEnergy(value: number, decimals: number = 1): string {
  const abs = Math.abs(value);
  
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(decimals)} MWh`;
  }
  
  return `${value.toFixed(decimals)} kWh`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = '¥', decimals: number = 2): string {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date | string, format: 'time' | 'date' | 'datetime' = 'datetime'): string {
  // Convert to Date object if it's a string (from API)
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'time':
      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    case 'date':
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    case 'datetime':
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}

/**
 * Get status text for grid power
 */
export function getGridStatusText(power: number): string {
  if (power > 5) {
    return 'IMPORTING FROM GRID';
  } else if (power < -5) {
    return 'EXPORTING TO GRID';
  } else {
    return 'BALANCED';
  }
}

/**
 * Get status text for storage
 */
export function getStorageStatusText(power: number): string {
  if (power > 5) {
    return 'CHARGING';
  } else if (power < -5) {
    return 'DISCHARGING';
  } else {
    return 'IDLE';
  }
}
