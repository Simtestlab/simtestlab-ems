/**
 * Solar Power Simulator
 * 
 * Physics-based solar generation modeling with:
 * - Accurate sun position calculations
 * - Seasonal and daily variations
 * - Cloud cover effects
 * - Temperature derating
 * - Panel orientation and tilt
 * - Inverter efficiency curves
 */

import {
  calculateSolarPosition,
  calculateClearSkyIrradiance,
  applyCloudCover,
  GeoLocation,
  SolarIrradiance,
} from '@/shared/utils/physics';
import { SolarSystemConfig } from './simulation-config';
import { WeatherState } from './weather-simulator';

export interface SolarOutput {
  /** DC power from panels in kW */
  dcPower: number;
  /** AC power after inverter in kW */
  acPower: number;
  /** Solar irradiance in W/m² */
  irradiance: number;
  /** Panel efficiency (%) */
  efficiency: number;
  /** Sun elevation angle (degrees) */
  solarElevation: number;
}

/**
 * Solar Power Simulator Class
 */
export class SolarSimulator {
  private config: SolarSystemConfig;
  private location: GeoLocation;
  private altitude: number;
  
  constructor(config: SolarSystemConfig, location: GeoLocation, altitude: number = 0) {
    this.config = config;
    this.location = location;
    this.altitude = altitude;
  }
  
  /**
   * Simulate solar power generation
   */
  public simulate(timestamp: number, weather: WeatherState): SolarOutput {
    // Calculate sun position
    const solarPosition = calculateSolarPosition(timestamp, this.location);
    
    // No generation if sun is below horizon
    if (solarPosition.elevation <= 0) {
      return {
        dcPower: 0,
        acPower: 0,
        irradiance: 0,
        efficiency: 0,
        solarElevation: solarPosition.elevation,
      };
    }
    
    // Calculate clear-sky irradiance
    const clearSkyIrradiance = calculateClearSkyIrradiance(solarPosition, this.altitude);
    
    // Apply cloud cover effects
    const actualIrradiance = applyCloudCover(clearSkyIrradiance, weather.cloudCoverage);
    
    // Calculate effective irradiance on tilted panel
    const effectiveIrradiance = this.calculatePanelIrradiance(
      actualIrradiance,
      solarPosition
    );
    
    // Calculate DC power output
    const dcPower = this.calculateDCPower(effectiveIrradiance, weather.temperature);
    
    // Apply inverter efficiency
    const acPower = this.calculateACPower(dcPower);
    
    // Calculate panel efficiency
    const efficiency = this.calculatePanelEfficiency(weather.temperature);
    
    return {
      dcPower,
      acPower,
      irradiance: effectiveIrradiance.global,
      efficiency: efficiency * 100,
      solarElevation: solarPosition.elevation,
    };
  }
  
  /**
   * Calculate irradiance on tilted panel surface
   */
  private calculatePanelIrradiance(
    irradiance: SolarIrradiance,
    solarPosition: { elevation: number; azimuth: number }
  ): SolarIrradiance {
    // Calculate angle of incidence on tilted panel
    const panelTiltRad = (this.config.tiltAngle * Math.PI) / 180;
    const panelAzimuthRad = (this.config.azimuthAngle * Math.PI) / 180;
    const sunElevationRad = (solarPosition.elevation * Math.PI) / 180;
    const sunAzimuthRad = (solarPosition.azimuth * Math.PI) / 180;
    
    // Calculate cosine of angle of incidence using spherical trigonometry
    const cosIncidence =
      Math.sin(sunElevationRad) * Math.cos(panelTiltRad) +
      Math.cos(sunElevationRad) * Math.sin(panelTiltRad) *
      Math.cos(sunAzimuthRad - panelAzimuthRad);
    
    // Don't allow negative (panel facing away from sun)
    const effectiveCosIncidence = Math.max(0, cosIncidence);
    
    // Direct component scaled by angle of incidence
    const direct = irradiance.direct * effectiveCosIncidence;
    
    // Diffuse component scaled by view factor (simplified)
    const viewFactor = (1 + Math.cos(panelTiltRad)) / 2;
    const diffuse = irradiance.diffuse * viewFactor;
    
    // Ground-reflected component (albedo ~0.2 for typical ground)
    const albedo = 0.2;
    const groundReflected = irradiance.global * albedo * (1 - viewFactor);
    
    const global = direct + diffuse + groundReflected;
    
    return { direct, diffuse, global };
  }
  
  /**
   * Calculate DC power output from panels
   */
  private calculateDCPower(irradiance: SolarIrradiance, temperature: number): number {
    // Standard test conditions: 1000 W/m², 25°C
    const stcIrradiance = 1000;
    const stcTemperature = 25;
    
    // Calculate panel efficiency at current temperature
    const efficiency = this.calculatePanelEfficiency(temperature);
    
    // Panel area needed for rated capacity
    // capacity (kW) = area (m²) * irradiance (kW/m²) * efficiency
    const panelArea = (this.config.capacity * 1000) / (stcIrradiance * this.config.efficiency);
    
    // Actual DC power
    const dcPower = (panelArea * irradiance.global * efficiency) / 1000; // Convert to kW
    
    // Apply system degradation
    return dcPower * this.config.degradation;
  }
  
  /**
   * Calculate panel efficiency with temperature derating
   */
  private calculatePanelEfficiency(temperature: number): number {
    // Panels lose efficiency as temperature rises
    const stcTemperature = 25;
    const tempDiff = temperature - stcTemperature;
    const tempLoss = tempDiff * this.config.temperatureCoefficient;
    
    const efficiency = this.config.efficiency * (1 + tempLoss);
    
    return Math.max(0, efficiency);
  }
  
  /**
   * Calculate AC power after inverter
   */
  private calculateACPower(dcPower: number): number {
    // Inverter efficiency curve (typically lower at low and high loads)
    const loadRatio = dcPower / this.config.capacity;
    
    let efficiencyCurve: number;
    if (loadRatio < 0.05) {
      // Very low load: poor efficiency
      efficiencyCurve = 0.80;
    } else if (loadRatio < 0.10) {
      // Low load: ramping up
      efficiencyCurve = 0.90;
    } else if (loadRatio < 0.90) {
      // Optimal range: peak efficiency
      efficiencyCurve = 1.0;
    } else {
      // High load: slight efficiency drop
      efficiencyCurve = 0.98;
    }
    
    const inverterEfficiency = this.config.inverterEfficiency * efficiencyCurve;
    
    // AC power limited by inverter rating
    const acPower = Math.min(dcPower * inverterEfficiency, this.config.capacity);
    
    return acPower;
  }
  
  /**
   * Get configuration
   */
  public getConfig(): SolarSystemConfig {
    return { ...this.config };
  }
}
