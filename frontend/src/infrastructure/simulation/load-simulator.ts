/**
 * Load Simulator
 * 
 * Realistic load modeling with:
 * - Temperature-responsive HVAC
 * - Occupancy-based lighting
 * - Equipment duty cycling
 * - Business hours patterns
 * - Weekend/holiday variations
 */

import { calculateHVACLoad } from '@/shared/utils/physics';
import { LoadConfig } from './simulation-config';
import { WeatherState } from './weather-simulator';

export interface LoadOutput {
  /** Total load power in kW */
  totalPower: number;
  /** Load breakdown */
  breakdown: {
    hvac: number;
    lighting: number;
    equipment: number;
    other: number;
  };
}

interface EquipmentState {
  cycleStartTime: number;
  isOn: boolean;
}

/**
 * Load Simulator Class
 */
export class LoadSimulator {
  private config: LoadConfig;
  private businessHours: { start: number; end: number; weekdaysOnly: boolean };
  private equipmentStates: EquipmentState[];
  
  constructor(
    config: LoadConfig,
    businessHours: { start: number; end: number; weekdaysOnly: boolean }
  ) {
    this.config = config;
    this.businessHours = businessHours;
    
    // Initialize equipment cycling states
    this.equipmentStates = Array.from({ length: config.equipment.cyclicalUnits }, () => ({
      cycleStartTime: Date.now() - Math.random() * config.equipment.cycleDuration * 60 * 1000,
      isOn: Math.random() > 0.5,
    }));
  }
  
  /**
   * Simulate building loads
   */
  public simulate(timestamp: number, weather: WeatherState): LoadOutput {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Determine occupancy level
    const occupancy = this.calculateOccupancy(hour, dayOfWeek);
    
    // Calculate HVAC load (temperature-responsive)
    const hvacLoad = this.calculateHVAC(weather, occupancy);
    
    // Calculate lighting load (occupancy-based)
    const lightingLoad = this.calculateLighting(occupancy, hour);
    
    // Calculate equipment load (duty cycling + base)
    const equipmentLoad = this.calculateEquipment(timestamp, occupancy);
    
    // Calculate other loads (base load minus components above)
    const componentSum = hvacLoad + lightingLoad + equipmentLoad;
    const otherLoad = Math.max(0, this.config.baseLoad - componentSum);
    
    const totalPower = hvacLoad + lightingLoad + equipmentLoad + otherLoad;
    
    return {
      totalPower,
      breakdown: {
        hvac: hvacLoad,
        lighting: lightingLoad,
        equipment: equipmentLoad,
        other: otherLoad,
      },
    };
  }
  
  /**
   * Calculate occupancy level (0-1)
   */
  private calculateOccupancy(hour: number, dayOfWeek: number): number {
    // Weekend check
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (this.businessHours.weekdaysOnly && isWeekend) {
      return 0.1; // 10% occupancy on weekends (security, maintenance)
    }
    
    // Business hours check
    if (hour < this.businessHours.start || hour >= this.businessHours.end) {
      return 0.05; // 5% occupancy outside business hours
    }
    
    // Ramp up at start of day
    if (hour < this.businessHours.start + 1) {
      const rampProgress = (hour - this.businessHours.start);
      return 0.3 + 0.6 * rampProgress; // 30% to 90%
    }
    
    // Lunch dip
    if (hour >= 12 && hour < 14) {
      return 0.6; // 60% during lunch
    }
    
    // Normal business hours
    if (hour < this.businessHours.end - 2) {
      return 0.9; // 90% normal occupancy
    }
    
    // Ramp down at end of day
    const rampDownProgress = (this.businessHours.end - hour) / 2;
    return 0.4 + 0.5 * rampDownProgress; // 40% to 90%
  }
  
  /**
   * Calculate HVAC load (temperature-responsive)
   */
  private calculateHVAC(weather: WeatherState, occupancy: number): number {
    // Base HVAC load from temperature
    const baseHVAC = calculateHVACLoad(
      weather.internalTemperature,
      this.config.hvac.setpoint,
      this.config.hvac.minPower,
      this.config.hvac.maxPower
    );
    
    // Scale by occupancy (more people = more cooling needed)
    const occupancyMultiplier = 1 + (occupancy * 0.3); // Up to 30% increase
    
    return Math.min(baseHVAC * occupancyMultiplier, this.config.hvac.maxPower);
  }
  
  /**
   * Calculate lighting load (occupancy-based)
   */
  private calculateLighting(occupancy: number, hour: number): number {
    const { minPower, maxPower, occupancyFactor } = this.config.lighting;
    
    // Base lighting need (from daylight availability)
    const isDaytime = hour >= 7 && hour < 19;
    const daylightFactor = isDaytime ? 0.6 : 1.0; // Less lighting needed during day
    
    // Occupancy-driven lighting
    const occupancyDriven = occupancy * occupancyFactor * (maxPower - minPower);
    
    // Total lighting
    const lighting = minPower + occupancyDriven * daylightFactor;
    
    return Math.min(lighting, maxPower);
  }
  
  /**
   * Calculate equipment load with duty cycling
   */
  private calculateEquipment(timestamp: number, occupancy: number): number {
    const { minPower, maxPower, cyclicalUnits, cycleDuration } = this.config.equipment;
    
    // Base equipment (always-on: servers, network, etc.)
    const baseEquipment = minPower;
    
    // Cyclical equipment (simulate individual unit duty cycles)
    let cyclicalPower = 0;
    const cycleDurationMs = cycleDuration * 60 * 1000;
    
    for (let i = 0; i < cyclicalUnits; i++) {
      const state = this.equipmentStates[i];
      const elapsed = timestamp - state.cycleStartTime;
      
      // Check if cycle should change state
      if (elapsed > cycleDurationMs) {
        // New cycle
        state.cycleStartTime = timestamp;
        // Probability of being on depends on occupancy
        state.isOn = Math.random() < (0.3 + 0.6 * occupancy);
      }
      
      if (state.isOn) {
        cyclicalPower += (maxPower - minPower) / cyclicalUnits;
      }
    }
    
    // Add some random variation
    const variation = 0.95 + Math.random() * 0.1;
    
    return (baseEquipment + cyclicalPower) * variation;
  }
  
  /**
   * Get configuration
   */
  public getConfig(): LoadConfig {
    return { ...this.config };
  }
}
