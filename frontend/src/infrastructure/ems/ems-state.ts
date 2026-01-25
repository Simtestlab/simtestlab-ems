/**
 * Global EMS State Singleton
 * 
 * This module maintains a single, shared EMS state that persists across API calls.
 * All API routes access the same state instance, ensuring consistency across:
 * - Multiple concurrent requests
 * - Page refreshes
 * - Different browser tabs
 * 
 * ⚠️ IMPORTANT: This is in-memory only. State will be lost on server restart.
 * For production, this would be replaced with Redis, a database, or other persistent store.
 */

export interface EMSPowerState {
  /** Grid power in kW (negative = exporting, positive = importing) */
  grid: number;
  /** Solar generation in kW */
  solar: number;
  /** Total load consumption in kW */
  load: number;
  /** Battery charge/discharge power in kW (negative = discharging, positive = charging) */
  battery: number;
}

export interface EMSKPIState {
  /** Total energy produced today in kWh */
  energyToday: number;
  /** Peak power demand today in kW */
  peakPowerToday: number;
  /** Cost savings accumulated today in $ */
  costSavings: number;
  /** Carbon emissions avoided today in kg CO2 */
  carbonAvoided: number;
  /** Battery state of charge in % (0-100) */
  batterySOC: number;
  /** Number of active sites */
  activeSites: number;
}

export interface EMSTimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface EMSChartState {
  grid: EMSTimeSeriesPoint[];
  solar: EMSTimeSeriesPoint[];
  load: EMSTimeSeriesPoint[];
  battery: EMSTimeSeriesPoint[];
}

export interface EMSGlobalState {
  /** Unix timestamp (ms) of last state update */
  lastUpdated: number;
  /** Current power values */
  power: EMSPowerState;
  /** Accumulated KPI metrics */
  kpis: EMSKPIState;
  /** Time-series data for charts (last N points) */
  charts: EMSChartState;
  /** Maximum number of chart data points to retain */
  maxChartPoints: number;
}

/**
 * Initial EMS state with realistic pre-populated values
 * This ensures the dashboard doesn't start from zero
 */
const createInitialState = (): EMSGlobalState => {
  const now = Date.now();
  
  return {
    lastUpdated: now,
    power: {
      grid: -296.4,    // Exporting to grid
      solar: 1200.0,   // Solar generation
      load: 890.0,     // Building consumption
      battery: 13.6,   // Slight charging
    },
    kpis: {
      energyToday: 2727.0,      // Pre-populated from "morning activity"
      peakPowerToday: 454.6,    // Already observed peak
      costSavings: 17728.0,     // Accumulated savings
      carbonAvoided: 2236.4,    // kg CO2
      batterySOC: 78.0,         // Battery partially charged
      activeSites: 6,           // Fixed for demo
    },
    charts: {
      grid: [],
      solar: [],
      load: [],
      battery: [],
    },
    maxChartPoints: 50, // Keep last 50 data points
  };
};

/**
 * Singleton state instance
 * ⚠️ DO NOT export this directly - use getter/setter functions
 */
let globalEMSState: EMSGlobalState | null = null;

/**
 * Get the current EMS state
 * Creates initial state on first access
 */
export function getEMSState(): EMSGlobalState {
  if (!globalEMSState) {
    globalEMSState = createInitialState();
    console.log('[EMS State] Initialized new global state at', new Date(globalEMSState.lastUpdated).toISOString());
  }
  return globalEMSState;
}

/**
 * Update the EMS state
 * This is the ONLY way to modify the global state
 */
export function updateEMSState(updater: (state: EMSGlobalState) => EMSGlobalState): void {
  const currentState = getEMSState();
  globalEMSState = updater(currentState);
  console.log('[EMS State] Updated at', new Date(globalEMSState.lastUpdated).toISOString());
}

/**
 * Add a data point to chart history
 * Automatically maintains the maxChartPoints limit
 */
export function addChartDataPoint(
  metric: keyof EMSChartState,
  timestamp: string,
  value: number
): void {
  updateEMSState((state) => {
    const newPoint: EMSTimeSeriesPoint = { timestamp, value };
    const updatedPoints = [...state.charts[metric], newPoint];
    
    // Keep only the last N points
    const trimmedPoints = updatedPoints.slice(-state.maxChartPoints);
    
    return {
      ...state,
      charts: {
        ...state.charts,
        [metric]: trimmedPoints,
      },
    };
  });
}

/**
 * Reset state to initial values
 * Useful for testing or manual reset
 */
export function resetEMSState(): void {
  globalEMSState = createInitialState();
  console.log('[EMS State] Reset to initial state');
}

/**
 * Get a read-only snapshot of current state
 * Prevents accidental mutations
 */
export function getEMSStateSnapshot(): Readonly<EMSGlobalState> {
  return Object.freeze(JSON.parse(JSON.stringify(getEMSState())));
}
