/**
 * Weather Simulator
 * 
 * Physics-based weather simulation with realistic patterns:
 * - Seasonal temperature variations
 * - Diurnal (daily) temperature cycles  
 * - Persistent cloud dynamics
 * - Humidity and wind modeling
 */

import {
  calculateSeasonalTemperature,
  calculateDiurnalTemperature,
  getDayOfYear,
  applyThermalMass,
} from '@/shared/utils/physics';
import { ClimateConfig } from './simulation-config';

export interface WeatherState {
  /** Current temperature in °C */
  temperature: number;
  /** Building internal temperature in °C (with thermal mass) */
  internalTemperature: number;
  /** Cloud coverage (0-1) */
  cloudCoverage: number;
  /** Humidity (0-100) */
  humidity: number;
  /** Wind speed in m/s */
  windSpeed: number;
  /** Precipitation rate in mm/h */
  precipitation: number;
}

/**
 * Weather Simulator Class
 */
export class WeatherSimulator {
  private config: ClimateConfig;
  private previousState: WeatherState;
  private cloudTarget: number;
  private cloudChangeCounter: number;
  
  constructor(config: ClimateConfig) {
    this.config = config;
    this.cloudTarget = config.avgCloudCoverage;
    this.cloudChangeCounter = 0;
    
    // Initialize with average conditions
    this.previousState = {
      temperature: config.avgTemperature,
      internalTemperature: config.avgTemperature,
      cloudCoverage: config.avgCloudCoverage,
      humidity: config.avgHumidity,
      windSpeed: 2.0,
      precipitation: 0,
    };
  }
  
  /**
   * Simulate weather for a given timestamp
   */
  public simulate(timestamp: number): WeatherState {
    const date = new Date(timestamp);
    const dayOfYear = getDayOfYear(timestamp);
    const hour = date.getHours() + date.getMinutes() / 60;
    
    // Calculate seasonal baseline temperature
    const seasonalTemp = calculateSeasonalTemperature(
      dayOfYear,
      this.config.avgTemperature,
      this.config.seasonalAmplitude
    );
    
    // Calculate diurnal (daily) temperature variation
    const outdoorTemp = calculateDiurnalTemperature(
      date.getHours(),
      seasonalTemp,
      this.config.diurnalAmplitude
    );
    
    // Apply thermal mass to building internal temperature
    const internalTemp = applyThermalMass(
      this.previousState.internalTemperature,
      outdoorTemp,
      0.85 // High thermal mass for commercial building
    );
    
    // Simulate cloud coverage with persistence
    const cloudCoverage = this.simulateCloudCoverage();
    
    // Calculate humidity (inversely correlated with temperature, positively with clouds)
    const tempFactor = 1 - (outdoorTemp - this.config.avgTemperature) / 20;
    const cloudFactor = 0.5 + cloudCoverage * 0.5;
    const humidity = Math.max(
      20,
      Math.min(
        95,
        this.config.avgHumidity * tempFactor * cloudFactor + (Math.random() - 0.5) * 10
      )
    );
    
    // Simulate wind speed (higher during day, more variable with clouds)
    const diurnalWindFactor = hour > 10 && hour < 18 ? 1.3 : 0.8;
    const cloudWindFactor = 1 + cloudCoverage * 0.5;
    const baseWind = 2 + Math.random() * 3;
    const windSpeed = baseWind * diurnalWindFactor * cloudWindFactor;
    
    // Simulate precipitation (only if heavily clouded)
    const precipitation = cloudCoverage > 0.7 && Math.random() > 0.9
      ? Math.random() * 10 // 0-10 mm/h
      : 0;
    
    const newState: WeatherState = {
      temperature: outdoorTemp,
      internalTemperature: internalTemp,
      cloudCoverage,
      humidity,
      windSpeed,
      precipitation,
    };
    
    this.previousState = newState;
    return newState;
  }
  
  /**
   * Simulate cloud coverage with realistic persistence
   */
  private simulateCloudCoverage(): number {
    this.cloudChangeCounter++;
    
    // Clouds change slowly (persistence)
    const changeInterval = Math.floor(100 / (1 - this.config.cloudPersistence));
    
    if (this.cloudChangeCounter >= changeInterval || Math.random() > 0.98) {
      // Time to change cloud target
      // 70% chance of typical conditions, 30% chance of extremes
      if (Math.random() > 0.3) {
        // Typical conditions near average
        this.cloudTarget = this.config.avgCloudCoverage + (Math.random() - 0.5) * 0.3;
      } else {
        // Extreme conditions
        this.cloudTarget = Math.random() > 0.5 ? 0.9 + Math.random() * 0.1 : 0.1 + Math.random() * 0.2;
      }
      
      this.cloudTarget = Math.max(0, Math.min(1, this.cloudTarget));
      this.cloudChangeCounter = 0;
    }
    
    // Gradually move toward target
    const smoothingFactor = 1 - this.config.cloudPersistence;
    const newCoverage =
      this.previousState.cloudCoverage * (1 - smoothingFactor) +
      this.cloudTarget * smoothingFactor;
    
    return Math.max(0, Math.min(1, newCoverage));
  }
  
  /**
   * Get current state without advancing simulation
   */
  public getCurrentState(): WeatherState {
    return { ...this.previousState };
  }
  
  /**
   * Reset simulator with new initial conditions
   */
  public reset(initialState?: Partial<WeatherState>): void {
    this.previousState = {
      ...this.previousState,
      ...initialState,
    };
    this.cloudChangeCounter = 0;
  }
}
