/**
 * Visual Update Throttling Hook
 * 
 * PURPOSE: Separate visual refresh rate from data acquisition rate
 * 
 * WHY THIS MATTERS IN PROFESSIONAL EMS:
 * 
 * 1. TELEMETRY (2s): Backend continuously collects high-frequency data
 * 2. VISUALIZATION (500ms-1s): UI updates at a rate comfortable for human perception
 * 3. AGGREGATED METRICS (30s-5min): Strategic KPIs update slower to prevent "flickering"
 * 
 * This matches real SCADA/EMS behavior where:
 * - Process data is collected at high rates (PLCs scan at ms intervals)
 * - HMI displays update at 1-2 second intervals
 * - Dashboard KPIs refresh at 30-60 second intervals
 * - Historical trends update at 5-15 minute intervals
 */

'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Throttle visual updates of rapidly changing values
 * 
 * USE CASE: Prevent KPI cards from "flickering" due to 2s telemetry updates
 * 
 * EXAMPLE:
 * ```tsx
 * const displayValue = useVisualThrottle(liveValue, 30000); // Update every 30s
 * ```
 */
export function useVisualThrottle<T>(
  value: T,
  throttleMs: number = 30000
): T {
  const [displayValue, setDisplayValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(Date.now());
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Update immediately on first render
    if (timeSinceLastUpdate >= throttleMs || displayValue === undefined) {
      setDisplayValue(value);
      lastUpdateRef.current = now;
      return;
    }

    // Schedule next update
    const timeUntilNextUpdate = throttleMs - timeSinceLastUpdate;
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setDisplayValue(value);
        lastUpdateRef.current = Date.now();
      }
    }, timeUntilNextUpdate);

    return () => clearTimeout(timer);
  }, [value, throttleMs, displayValue]);

  return displayValue;
}

/**
 * Smooth value transitions for animated KPI displays
 * 
 * USE CASE: Gradually transition large value jumps instead of instant updates
 * 
 * PROFESSIONAL BEHAVIOR:
 * - Large jumps are interpolated over time
 * - Prevents jarring visual changes
 * - Maintains user trust in the system
 * 
 * EXAMPLE:
 * ```tsx
 * const smoothedValue = useSmoothValue(rawValue, 1000); // 1s interpolation
 * ```
 */
export function useSmoothValue(
  targetValue: number,
  transitionMs: number = 1000
): number {
  const [currentValue, setCurrentValue] = useState<number>(targetValue);
  const frameRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef<number>(targetValue);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // If change is small (< 5%), update immediately
    const percentChange = Math.abs((targetValue - currentValue) / (currentValue || 1)) * 100;
    if (percentChange < 5) {
      setCurrentValue(targetValue);
      return;
    }

    // Start smooth interpolation for large changes
    startValueRef.current = currentValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / transitionMs, 1);
      
      // Ease-out cubic for natural deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const interpolated = startValueRef.current + 
        (targetValue - startValueRef.current) * easedProgress;
      
      setCurrentValue(interpolated);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue); // Ensure exact final value
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetValue, transitionMs, currentValue]);

  return currentValue;
}

/**
 * Debounced value updates for user-triggered events
 * 
 * USE CASE: Wait for user to finish interacting before updating
 * 
 * EXAMPLE: Map zoom, filter changes, time range selection
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Batch multiple rapid updates into single render
 * 
 * USE CASE: Multiple state updates happening in quick succession
 * 
 * PROFESSIONAL BEHAVIOR:
 * - Collect updates over short time window (100-200ms)
 * - Render once with all changes
 * - Reduces visual "thrashing"
 */
export function useBatchedUpdates<T>(
  updates: T[],
  batchWindowMs: number = 150
): T[] {
  const [batchedUpdates, setBatchedUpdates] = useState<T[]>(updates);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingRef = useRef<T[]>([]);

  useEffect(() => {
    pendingRef.current.push(...updates);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setBatchedUpdates([...pendingRef.current]);
      pendingRef.current = [];
    }, batchWindowMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [updates, batchWindowMs]);

  return batchedUpdates;
}

/**
 * EMS Update Rate Manager
 * 
 * Provides update rate discipline across the dashboard
 * following real industrial EMS patterns
 */
export interface EMSUpdateRates {
  telemetry: number;      // High-frequency live data
  energy: number;         // Medium-frequency aggregated
  business: number;       // Low-frequency strategic
  visual: number;         // Visual refresh rate
}

export const EMS_UPDATE_RATES: EMSUpdateRates = {
  telemetry: 2000,        // 2s - Real-time charts, live power
  energy: 30000,          // 30s - Energy totals, SOC, efficiency
  business: 300000,       // 5min - Peak power, costs, health
  visual: 500,            // 500ms - UI animations, smooth transitions
};

/**
 * Hook to enforce EMS-standard update rates
 * 
 * USAGE:
 * ```tsx
 * const { shouldUpdate, lastUpdate } = useEMSUpdateRate('energy');
 * 
 * useEffect(() => {
 *   if (shouldUpdate) {
 *     // Update KPI display
 *   }
 * }, [shouldUpdate, metrics]);
 * ```
 */
export function useEMSUpdateRate(
  rateType: keyof EMSUpdateRates
): { shouldUpdate: boolean; lastUpdate: Date } {
  const [shouldUpdate, setShouldUpdate] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const updateInterval = EMS_UPDATE_RATES[rateType];

  useEffect(() => {
    setShouldUpdate(true);
    setLastUpdate(new Date());

    const timer = setInterval(() => {
      setShouldUpdate(true);
      setLastUpdate(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  useEffect(() => {
    if (shouldUpdate) {
      // Reset flag after one render cycle
      const resetTimer = setTimeout(() => {
        setShouldUpdate(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }
  }, [shouldUpdate]);

  return { shouldUpdate, lastUpdate };
}
