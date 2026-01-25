/**
 * Battery Controller
 * 
 * Intelligent battery management strategies:
 * - Self-consumption: Maximize use of solar energy
 * - Peak-shaving: Reduce peak grid demand
 * - Time-of-use: Optimize for tariff schedules
 * - Backup: Maintain reserve for outages
 */

import { StorageSystemConfig, BatteryStrategy } from './simulation-config';

export interface BatteryState {
  /** State of charge (%) */
  soc: number;
  /** Current power (kW, positive = charging, negative = discharging) */
  power: number;
  /** Battery temperature (°C) */
  temperature: number;
  /** Voltage (V) */
  voltage: number;
  /** Current (A) */
  current: number;
}

export interface EnergyBalance {
  solar: number;        // kW
  consumption: number;  // kW
  grid: number;         // kW (will be calculated)
}

/**
 * Battery Controller Class
 */
export class BatteryController {
  private config: StorageSystemConfig;
  private strategy: BatteryStrategy;
  private currentSoc: number;
  private previousPower: number;
  private batteryTemperature: number;
  
  constructor(config: StorageSystemConfig, strategy: BatteryStrategy) {
    this.config = config;
    this.strategy = strategy;
    this.currentSoc = config.initialSoc;
    this.previousPower = 0;
    this.batteryTemperature = 25; // Start at 25°C
  }
  
  /**
   * Calculate optimal battery power and update state
   */
  public control(
    timestamp: number,
    energyBalance: EnergyBalance,
    deltaTimeMs: number = 2000
  ): BatteryState {
    const hour = new Date(timestamp).getHours();
    
    // Calculate target power based on strategy
    let targetPower: number;
    
    switch (this.strategy.mode) {
      case 'self-consumption':
        targetPower = this.selfConsumptionStrategy(energyBalance);
        break;
      
      case 'peak-shaving':
        targetPower = this.peakShavingStrategy(energyBalance);
        break;
      
      case 'time-of-use':
        targetPower = this.timeOfUseStrategy(energyBalance, hour);
        break;
      
      case 'backup':
        targetPower = this.backupStrategy(energyBalance);
        break;
      
      default:
        targetPower = 0;
    }
    
    // Apply physical constraints
    targetPower = this.applyConstraints(targetPower);
    
    // Smooth power transitions
    const smoothedPower = this.smoothPower(targetPower);
    
    // Update state of charge
    this.updateSoc(smoothedPower, deltaTimeMs);
    
    // Update battery temperature
    this.updateTemperature(smoothedPower);
    
    // Calculate voltage and current
    const voltage = this.calculateVoltage();
    const current = Math.abs(smoothedPower * 1000 / voltage); // Convert kW to A
    
    this.previousPower = smoothedPower;
    
    return {
      soc: this.currentSoc,
      power: smoothedPower,
      temperature: this.batteryTemperature,
      voltage,
      current,
    };
  }
  
  /**
   * Self-consumption strategy: maximize solar utilization
   */
  private selfConsumptionStrategy(balance: EnergyBalance): number {
    const surplus = balance.solar - balance.consumption;
    
    if (surplus > 10) {
      // Excess solar: charge battery
      return Math.min(surplus * 0.95, this.config.maxPower);
    } else if (surplus < -10) {
      // Deficit: discharge battery to offset grid import
      const deficit = Math.abs(surplus);
      return -Math.min(deficit * 0.95, this.config.maxPower);
    }
    
    // Near balance: minimize battery action
    return this.previousPower * 0.7;
  }
  
  /**
   * Peak-shaving strategy: limit grid import
   */
  private peakShavingStrategy(balance: EnergyBalance): number {
    const threshold = this.strategy.peakThreshold || 200; // Default 200 kW
    const netDemand = balance.consumption - balance.solar;
    
    if (netDemand > threshold) {
      // Above threshold: discharge to shave peak
      const excessDemand = netDemand - threshold;
      return -Math.min(excessDemand, this.config.maxPower);
    } else if (balance.solar > balance.consumption) {
      // Surplus solar: charge for future peak shaving
      const surplus = balance.solar - balance.consumption;
      return Math.min(surplus * 0.9, this.config.maxPower);
    }
    
    return 0;
  }
  
  /**
   * Time-of-use strategy: charge during cheap hours, discharge during expensive hours
   */
  private timeOfUseStrategy(balance: EnergyBalance, hour: number): number {
    const schedule = this.strategy.touSchedule;
    if (!schedule) {
      return this.selfConsumptionStrategy(balance);
    }
    
    const isChargeTime = schedule.chargeHours.includes(hour);
    const isDischargeTime = schedule.dischargeHours.includes(hour);
    
    if (isChargeTime) {
      // Charge from grid or solar
      const availablePower = balance.solar + 100; // Can import up to 100 kW for charging
      return Math.min(availablePower * 0.9, this.config.maxPower);
    } else if (isDischargeTime) {
      // Discharge to offset consumption
      const demand = balance.consumption - balance.solar;
      return -Math.min(Math.max(0, demand) * 0.9, this.config.maxPower);
    }
    
    // Off-peak: self-consumption mode
    return this.selfConsumptionStrategy(balance);
  }
  
  /**
   * Backup strategy: maintain reserve, charge from solar only
   */
  private backupStrategy(balance: EnergyBalance): number {
    const reserve = this.strategy.backupReserve || 30; // Default 30% reserve
    
    // Never discharge below reserve
    if (this.currentSoc <= reserve + 5) {
      // Only charge from solar
      const surplus = Math.max(0, balance.solar - balance.consumption);
      return Math.min(surplus * 0.9, this.config.maxPower);
    }
    
    // Above reserve: allow limited discharge
    if (balance.consumption > balance.solar) {
      const deficit = balance.consumption - balance.solar;
      const maxDischarge = (this.currentSoc - reserve) / 100 * this.config.capacity / 10; // Conservative
      return -Math.min(deficit * 0.5, maxDischarge, this.config.maxPower);
    }
    
    // Surplus solar: charge
    const surplus = balance.solar - balance.consumption;
    return Math.min(surplus * 0.9, this.config.maxPower);
  }
  
  /**
   * Apply physical and operational constraints
   */
  private applyConstraints(targetPower: number): number {
    // SOC limits
    if (targetPower > 0 && this.currentSoc >= this.config.maxSoc - 1) {
      return 0; // Stop charging near max SOC
    }
    if (targetPower < 0 && this.currentSoc <= this.config.minSoc + 1) {
      return 0; // Stop discharging near min SOC
    }
    
    // Power limits
    const constrainedPower = Math.max(-this.config.maxPower, Math.min(this.config.maxPower, targetPower));
    
    // Taper charging near max SOC
    if (constrainedPower > 0 && this.currentSoc > this.config.maxSoc - 5) {
      const taperFactor = (this.config.maxSoc - this.currentSoc) / 5;
      return constrainedPower * taperFactor;
    }
    
    // Taper discharging near min SOC
    if (constrainedPower < 0 && this.currentSoc < this.config.minSoc + 5) {
      const taperFactor = (this.currentSoc - this.config.minSoc) / 5;
      return constrainedPower * taperFactor;
    }
    
    return constrainedPower;
  }
  
  /**
   * Smooth power transitions to avoid sudden changes
   */
  private smoothPower(targetPower: number): number {
    const smoothingFactor = 0.3;
    return this.previousPower * (1 - smoothingFactor) + targetPower * smoothingFactor;
  }
  
  /**
   * Update state of charge based on power flow
   */
  private updateSoc(power: number, deltaTimeMs: number): void {
    // Apply self-discharge
    const selfDischargePerMs = this.config.selfDischargeRate / (60 * 60 * 1000);
    this.currentSoc -= this.currentSoc * selfDischargePerMs * deltaTimeMs;
    
    // Apply power flow with efficiency
    const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
    const efficiency = power > 0 ? this.config.efficiency : 1 / this.config.efficiency;
    const energyChange = (power * efficiency * deltaTimeHours) / this.config.capacity * 100;
    
    this.currentSoc += energyChange;
    
    // Clamp to valid range
    this.currentSoc = Math.max(this.config.minSoc, Math.min(this.config.maxSoc, this.currentSoc));
  }
  
  /**
   * Update battery temperature based on power flow
   */
  private updateTemperature(power: number): void {
    const ambientTemp = 25; // °C
    const thermalMass = 0.9; // High thermal mass
    
    // Heat generation from power flow (higher at higher power)
    const heatGeneration = Math.abs(power) / this.config.maxPower * 15; // Up to 15°C rise
    
    // Target temperature
    const targetTemp = ambientTemp + heatGeneration;
    
    // Apply thermal mass
    this.batteryTemperature = this.batteryTemperature * thermalMass + targetTemp * (1 - thermalMass);
  }
  
  /**
   * Calculate battery voltage based on SOC
   */
  private calculateVoltage(): number {
    // Typical lithium-ion voltage curve
    const baseVoltage = 800; // V
    const socFactor = (this.currentSoc - 50) / 50; // -1 to 1 around 50%
    
    return baseVoltage + socFactor * 40; // ±40V range
  }
  
  /**
   * Get current SOC
   */
  public getSoc(): number {
    return this.currentSoc;
  }
  
  /**
   * Set SOC (for initialization/testing)
   */
  public setSoc(soc: number): void {
    this.currentSoc = Math.max(this.config.minSoc, Math.min(this.config.maxSoc, soc));
  }
  
  /**
   * Get configuration
   */
  public getConfig(): StorageSystemConfig {
    return { ...this.config };
  }
  
  /**
   * Get strategy
   */
  public getStrategy(): BatteryStrategy {
    return { ...this.strategy };
  }
}
