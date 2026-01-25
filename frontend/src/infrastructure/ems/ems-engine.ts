/**
 * EMS Simulation Engine - Pure Physics Layer
 * 
 * Core time-based simulation logic that advances the EMS state realistically.
 * Uses delta-time physics to ensure consistent behavior regardless of update frequency.
 * 
 * ⚠️ CRITICAL: This module should ONLY be called by ems-runner.ts
 * API routes must NEVER call advanceEMSSimulation() directly.
 * 
 * KEY PRINCIPLES:
 * 1. Time-based updates (not tick-based)
 * 2. Power integration → Energy accumulation
 * 3. Bounded randomness for stability
 * 4. Industrial-grade value constraints
 * 5. Autonomous operation (not request-driven)
 * 
 * REAL-WORLD ANALOGY:
 * This is like a RTU (Remote Terminal Unit) that continuously samples
 * sensors and updates telemetry, regardless of whether anyone is watching
 * the SCADA display.
 */

import {
  getEMSState,
  updateEMSState,
  addChartDataPoint,
  EMSGlobalState,
  EMSPowerState,
  EMSKPIState,
} from './ems-state';

/**
 * Configuration constants for simulation behavior
 */
const SIMULATION_CONFIG = {
  // Solar generation bounds (kW)
  SOLAR_MIN: 0,
  SOLAR_MAX: 1500,
  SOLAR_PEAK_CAPACITY: 1400, // Installed capacity
  
  // Load consumption bounds (kW)
  LOAD_MIN: 700,
  LOAD_MAX: 1100,
  LOAD_BASE: 850, // Baseline load
  
  // Battery power bounds (kW)
  BATTERY_MAX_CHARGE: 200,
  BATTERY_MAX_DISCHARGE: 200,
  BATTERY_CAPACITY_KWH: 500,
  
  // Battery SOC bounds (%)
  SOC_MIN: 20,
  SOC_MAX: 95,
  SOC_SAFE_MIN: 25, // Start discharging less aggressively
  SOC_SAFE_MAX: 90, // Start charging less aggressively
  
  // Battery behavior
  BATTERY_EFFICIENCY: 0.92, // Round-trip efficiency (92%)
  BATTERY_HYSTERESIS_KW: 30, // Minimum power difference to trigger mode change
  BATTERY_RAMP_RATE: 0.2, // Max power change per second (kW/s)
  
  // Load inertia
  LOAD_EMA_ALPHA: 0.15, // Exponential moving average smoothing (lower = smoother)
  LOAD_NOISE_RANGE: 15, // Random noise amplitude (kW)
  
  // Energy to cost conversion ($/kWh)
  COST_PER_KWH: 0.15,
  
  // Energy to carbon conversion (kg CO2/kWh)
  CARBON_PER_KWH: 0.82,
  
  // Minimum time between updates (ms)
  MIN_UPDATE_INTERVAL: 500,
  
  // KPI update intervals (ms)
  KPI_ENERGY_UPDATE_INTERVAL: 30000, // 30 seconds
  KPI_COST_CARBON_UPDATE_INTERVAL: 300000, // 5 minutes
} as const;

/**
 * Internal state for smoothing and inertia
 * This persists across simulation ticks
 */
let previousLoadTarget: number = 850; // SIMULATION_CONFIG.LOAD_BASE
let smoothedLoad: number = 850;
let previousBatteryPower: number = 0;
let batteryModeHysteresis: 'charging' | 'discharging' | 'idle' = 'idle';
let lastKPIEnergyUpdate: number = Date.now();
let lastKPICostCarbonUpdate: number = Date.now();

/**
 * Generate bounded random noise
 * Used to add realistic fluctuations to power values
 */
function boundedNoise(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate realistic solar power based on time of day
 * Implements a diurnal curve with morning ramp, midday peak, evening taper
 * 
 * PROFESSIONAL BEHAVIOR:
 * - Follows sun position (simplified sine curve)
 * - Peak at solar noon (~12:00)
 * - Smooth transitions
 * - Small realistic noise (±2-3%)
 */
function calculateSolarPower(timestamp: Date): number {
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const hourDecimal = hour + minute / 60;
  
  // Define solar day parameters
  const sunrise = 6.0; // 06:00
  const sunset = 18.0; // 18:00
  const solarNoon = 12.0; // Peak generation time
  
  // No generation outside daylight hours
  if (hourDecimal < sunrise || hourDecimal > sunset) {
    return 0;
  }
  
  // Calculate position in solar day (0 to 1)
  const dayProgress = (hourDecimal - sunrise) / (sunset - sunrise);
  
  // Use sine curve for realistic solar profile
  // Peak at solar noon, smooth ramps at edges
  const sineValue = Math.sin(dayProgress * Math.PI);
  
  // Apply curve shaping for more realistic profile
  // Real solar has sharper morning ramp, flatter midday, gradual evening taper
  let shapedValue: number;
  if (dayProgress < 0.25) {
    // Morning ramp (faster rise)
    shapedValue = Math.pow(sineValue, 0.7);
  } else if (dayProgress > 0.75) {
    // Evening taper (gradual decline)
    shapedValue = Math.pow(sineValue, 0.8);
  } else {
    // Midday plateau (flatter peak)
    shapedValue = Math.pow(sineValue, 0.6);
  }
  
  // Scale to capacity
  const basePower = shapedValue * SIMULATION_CONFIG.SOLAR_PEAK_CAPACITY;
  
  // Add small bounded noise (±2-3% variation for clouds, temperature, etc.)
  const noisePercent = 0.025; // 2.5%
  const noise = boundedNoise(-noisePercent, noisePercent) * basePower;
  
  const solarPower = Math.max(0, basePower + noise);
  
  return solarPower;
}

/**
 * Calculate realistic load with temporal inertia
 * Implements EMA smoothing to prevent sudden jumps
 * 
 * PROFESSIONAL BEHAVIOR:
 * - Slow, smooth changes (industrial loads have thermal/mechanical inertia)
 * - Small random walk
 * - Occasional load events (equipment starting)
 * - Feels "heavy and predictable"
 */
function calculateLoadPower(deltaTimeSeconds: number): number {
  // Random walk: small bounded drift
  const drift = boundedNoise(-SIMULATION_CONFIG.LOAD_NOISE_RANGE, SIMULATION_CONFIG.LOAD_NOISE_RANGE);
  
  // Occasional load events (5% chance per update)
  let eventPower = 0;
  if (Math.random() < 0.05) {
    // Equipment starting or stopping
    eventPower = boundedNoise(-80, 100);
  }
  
  // New target load
  const targetLoad = clamp(
    previousLoadTarget + drift + eventPower,
    SIMULATION_CONFIG.LOAD_MIN,
    SIMULATION_CONFIG.LOAD_MAX
  );
  
  // Apply exponential moving average (EMA) for smooth transitions
  // Lower alpha = more smoothing = more inertia
  const alpha = SIMULATION_CONFIG.LOAD_EMA_ALPHA;
  smoothedLoad = alpha * targetLoad + (1 - alpha) * smoothedLoad;
  
  // Update previous target for next iteration
  previousLoadTarget = targetLoad;
  
  return smoothedLoad;
}

/**
 * Calculate battery power with industrial control logic
 * Implements hysteresis, SOC protection, and smooth ramping
 * 
 * PROFESSIONAL BEHAVIOR:
 * - Protective: respects SOC limits strictly
 * - Conservative: hysteresis prevents mode flapping
 * - Smooth: power changes are rate-limited
 * - Efficient: accounts for round-trip losses
 */
function calculateBatteryPower(
  currentSOC: number,
  surplus: number, // solar - load (positive = excess solar)
  deltaTimeSeconds: number
): number {
  let targetPower = 0;
  
  // === SOC PROTECTION LOGIC ===
  // Never charge above SOC_SAFE_MAX, never discharge below SOC_SAFE_MIN
  
  if (currentSOC >= SIMULATION_CONFIG.SOC_MAX) {
    // Battery full - no charging allowed
    targetPower = 0;
    batteryModeHysteresis = 'idle';
  } else if (currentSOC <= SIMULATION_CONFIG.SOC_MIN) {
    // Battery depleted - no discharging allowed
    targetPower = 0;
    batteryModeHysteresis = 'idle';
  } else if (surplus > SIMULATION_CONFIG.BATTERY_HYSTERESIS_KW) {
    // Excess solar available - consider charging
    if (currentSOC < SIMULATION_CONFIG.SOC_SAFE_MAX) {
      // Safe to charge
      const chargeRoom = (SIMULATION_CONFIG.SOC_MAX - currentSOC) / 100;
      const chargeCapability = chargeRoom * SIMULATION_CONFIG.BATTERY_CAPACITY_KWH * 2; // C/2 rate
      
      targetPower = Math.min(
        surplus * 0.8, // Use 80% of surplus
        SIMULATION_CONFIG.BATTERY_MAX_CHARGE,
        chargeCapability
      );
      batteryModeHysteresis = 'charging';
    } else {
      // Approaching full - reduce charging
      targetPower = Math.min(surplus * 0.3, 30);
      batteryModeHysteresis = 'charging';
    }
  } else if (surplus < -SIMULATION_CONFIG.BATTERY_HYSTERESIS_KW) {
    // Deficit - consider discharging
    if (currentSOC > SIMULATION_CONFIG.SOC_SAFE_MIN) {
      // Safe to discharge
      const deficit = Math.abs(surplus);
      const dischargeRoom = (currentSOC - SIMULATION_CONFIG.SOC_MIN) / 100;
      const dischargeCapability = dischargeRoom * SIMULATION_CONFIG.BATTERY_CAPACITY_KWH * 2; // C/2 rate
      
      targetPower = Math.max(
        -deficit * 0.6, // Cover 60% of deficit
        -SIMULATION_CONFIG.BATTERY_MAX_DISCHARGE,
        -dischargeCapability
      );
      batteryModeHysteresis = 'discharging';
    } else {
      // Approaching empty - stop discharging
      targetPower = 0;
      batteryModeHysteresis = 'idle';
    }
  } else {
    // Neutral zone - maintain current mode or idle
    if (batteryModeHysteresis === 'charging' && currentSOC < SIMULATION_CONFIG.SOC_SAFE_MAX) {
      targetPower = Math.min(surplus * 0.5, 30);
    } else if (batteryModeHysteresis === 'discharging' && currentSOC > SIMULATION_CONFIG.SOC_SAFE_MIN) {
      targetPower = Math.max(surplus * 0.3, -30);
    } else {
      targetPower = 0;
      batteryModeHysteresis = 'idle';
    }
  }
  
  // === SMOOTH POWER RAMPING ===
  // Industrial battery systems don't change power instantly
  const maxPowerChange = SIMULATION_CONFIG.BATTERY_RAMP_RATE * deltaTimeSeconds;
  const powerDelta = targetPower - previousBatteryPower;
  
  let actualPower: number;
  if (Math.abs(powerDelta) <= maxPowerChange) {
    actualPower = targetPower;
  } else {
    // Ramp limited
    actualPower = previousBatteryPower + Math.sign(powerDelta) * maxPowerChange;
  }
  
  // Update state for next iteration
  previousBatteryPower = actualPower;
  
  return actualPower;
}

/**
 * Update power values with realistic physics
 * Uses time-of-day solar, inertial load, and protective battery control
 */
function updatePowerValues(currentPower: EMSPowerState, currentSOC: number, timestamp: Date, deltaTimeSeconds: number): EMSPowerState {
  // === SOLAR GENERATION (time-based diurnal curve) ===
  const solar = calculateSolarPower(timestamp);
  
  // === LOAD CONSUMPTION (smooth with inertia) ===
  const load = calculateLoadPower(deltaTimeSeconds);
  
  // === ENERGY BALANCE ===
  const surplus = solar - load;
  
  // === BATTERY POWER (industrial control logic) ===
  const battery = calculateBatteryPower(currentSOC, surplus, deltaTimeSeconds);
  
  // === GRID POWER (residual) ===
  // Grid makes up the difference: grid = load - solar - battery
  // Positive = importing from grid
  // Negative = exporting to grid
  const grid = load - solar - battery;
  
  return {
    solar: Math.round(solar * 10) / 10,
    load: Math.round(load * 10) / 10,
    battery: Math.round(battery * 10) / 10,
    grid: Math.round(grid * 10) / 10,
  };
}

/**
 * Update battery SOC based on charging/discharging
 * Uses power integration: SOC change = (power × time) / capacity
 * Includes round-trip efficiency losses
 */
function updateBatterySOC(
  currentSOC: number,
  batteryPower: number,
  deltaTimeSeconds: number
): number {
  // Convert power to energy (kWh)
  const energyChange = (batteryPower * deltaTimeSeconds) / 3600;
  
  // Apply efficiency:
  // - Charging: account for conversion losses
  // - Discharging: account for conversion losses
  let effectiveEnergyChange: number;
  if (batteryPower > 0) {
    // Charging: less energy stored than consumed due to losses
    effectiveEnergyChange = energyChange * SIMULATION_CONFIG.BATTERY_EFFICIENCY;
  } else {
    // Discharging: more energy drawn from battery than delivered
    effectiveEnergyChange = energyChange / SIMULATION_CONFIG.BATTERY_EFFICIENCY;
  }
  
  // Update SOC (%)
  const socChange = (effectiveEnergyChange / SIMULATION_CONFIG.BATTERY_CAPACITY_KWH) * 100;
  
  // Small self-discharge (0.1% per hour)
  const selfDischarge = -0.1 * (deltaTimeSeconds / 3600);
  
  const newSOC = currentSOC + socChange + selfDischarge;
  
  return clamp(newSOC, SIMULATION_CONFIG.SOC_MIN, SIMULATION_CONFIG.SOC_MAX);
}

/**
 * Update accumulated energy
 * Integrates solar power over time: Energy = Power × Time
 */
function updateEnergyToday(
  currentEnergy: number,
  solarPower: number,
  deltaTimeSeconds: number
): number {
  // Convert power (kW) × time (s) → energy (kWh)
  const energyGenerated = (solarPower * deltaTimeSeconds) / 3600;
  
  return currentEnergy + energyGenerated;
}

/**
 * Update peak power if current load exceeds it
 */
function updatePeakPower(currentPeak: number, currentLoad: number): number {
  return Math.max(currentPeak, currentLoad);
}

/**
 * Update cost savings based on energy generated
 * Savings = (Energy exported + Energy self-consumed) × Rate
 */
function updateCostSavings(
  currentSavings: number,
  solarPower: number,
  deltaTimeSeconds: number
): number {
  const energyGenerated = (solarPower * deltaTimeSeconds) / 3600;
  const savingsIncrement = energyGenerated * SIMULATION_CONFIG.COST_PER_KWH;
  
  return currentSavings + savingsIncrement;
}

/**
 * Update carbon avoided based on solar energy
 * Carbon avoided = Solar energy × Emission factor
 */
function updateCarbonAvoided(
  currentCarbon: number,
  solarPower: number,
  deltaTimeSeconds: number
): number {
  const energyGenerated = (solarPower * deltaTimeSeconds) / 3600;
  const carbonAvoided = energyGenerated * SIMULATION_CONFIG.CARBON_PER_KWH;
  
  return currentCarbon + carbonAvoided;
}

/**
 * Main simulation update function
 * 
 * ⚠️ CRITICAL: This should ONLY be called by the telemetry runner (ems-runner.ts)
 * API routes must use getEMSStateSnapshot() for read-only access.
 * 
 * This function advances the EMS simulation based on wall-clock time,
 * mimicking how real RTU/PLC systems continuously update telemetry
 * regardless of UI activity.
 * 
 * PROFESSIONAL EMS BEHAVIOR:
 * - Power values: Update every telemetry scan (2s)
 * - Battery SOC: Update every scan (critical for control)
 * - Energy accumulation: Update every scan (integration)
 * - KPIs (Cost/Carbon): Update at slower intervals (5min)
 * - Peak tracking: Update only when exceeded
 * 
 * @returns Updated EMS state
 */
export function advanceEMSSimulation(): EMSGlobalState {
  const state = getEMSState();
  const now = Date.now();
  const deltaTimeMs = now - state.lastUpdated;
  
  // Prevent too-frequent updates (debounce)
  if (deltaTimeMs < SIMULATION_CONFIG.MIN_UPDATE_INTERVAL) {
    return state; // Return current state without updating
  }
  
  const deltaTimeSeconds = deltaTimeMs / 1000;
  
  // Don't update if time delta is unreasonably large (server was down, etc.)
  // Cap at 5 minutes to prevent huge jumps
  const cappedDeltaSeconds = Math.min(deltaTimeSeconds, 300);
  
  // === POWER VALUES (continuous telemetry sampling) ===
  const timestamp = new Date(now);
  const newPower = updatePowerValues(
    state.power, 
    state.kpis.batterySOC, 
    timestamp, 
    cappedDeltaSeconds
  );
  
  // === BATTERY SOC (continuous integration - critical for control) ===
  const newSOC = updateBatterySOC(state.kpis.batterySOC, newPower.battery, cappedDeltaSeconds);
  
  // === ENERGY ACCUMULATION (continuous integration) ===
  const newEnergyToday = updateEnergyToday(state.kpis.energyToday, newPower.solar, cappedDeltaSeconds);
  
  // === PEAK POWER (update only when exceeded) ===
  const newPeakPower = updatePeakPower(state.kpis.peakPowerToday, newPower.load);
  
  // === KPI UPDATE DISCIPLINE ===
  // Cost and carbon update at slower intervals (5 minutes) to prevent flickering
  let newCostSavings = state.kpis.costSavings;
  let newCarbonAvoided = state.kpis.carbonAvoided;
  
  const timeSinceLastCostUpdate = now - lastKPICostCarbonUpdate;
  if (timeSinceLastCostUpdate >= SIMULATION_CONFIG.KPI_COST_CARBON_UPDATE_INTERVAL) {
    // Calculate accumulated values since last update
    newCostSavings = updateCostSavings(state.kpis.costSavings, newPower.solar, cappedDeltaSeconds);
    newCarbonAvoided = updateCarbonAvoided(state.kpis.carbonAvoided, newPower.solar, cappedDeltaSeconds);
    lastKPICostCarbonUpdate = now;
  }
  
  // Build new KPI state
  let newKPIs: EMSKPIState = {
    energyToday: Math.round(newEnergyToday * 10) / 10,
    peakPowerToday: Math.round(newPeakPower * 10) / 10,
    costSavings: Math.round(newCostSavings * 100) / 100,
    carbonAvoided: Math.round(newCarbonAvoided * 10) / 10,
    batterySOC: Math.round(newSOC * 10) / 10,
    activeSites: state.kpis.activeSites, // Static
  };
  
  // Create updated state
  const newState: EMSGlobalState = {
    ...state,
    lastUpdated: now,
    power: newPower,
    kpis: newKPIs,
  };
  
  // Update the global state (atomic operation)
  updateEMSState(() => newState);
  
  // Append new telemetry to chart history (time-series logging)
  const timestampISO = timestamp.toISOString();
  addChartDataPoint('grid', timestampISO, newPower.grid);
  addChartDataPoint('solar', timestampISO, newPower.solar);
  addChartDataPoint('load', timestampISO, newPower.load);
  addChartDataPoint('battery', timestampISO, newPower.battery);
  
  return newState;
}

/**
 * Get current state snapshot (READ-ONLY)
 * 
 * ✅ USE THIS in API routes
 * ❌ DO NOT use advanceEMSSimulation() in API routes
 * 
 * This is the proper way for HTTP handlers to read telemetry data
 * without affecting the simulation timeline.
 * 
 * @returns Frozen snapshot of current EMS state
 */
export function getEMSStateSnapshot(): Readonly<EMSGlobalState> {
  return getEMSState();
}
