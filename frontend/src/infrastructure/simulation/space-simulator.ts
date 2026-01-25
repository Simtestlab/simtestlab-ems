/**
 * Space Simulator
 * 
 * Generates independent metrics for each leaf space (zones) in the hierarchy.
 * Parent spaces (sites, buildings, floors) get their metrics from aggregation.
 */

import {
  HierarchicalSpace,
  SpaceMetrics,
  SpaceType,
} from '@/domain/entities/hierarchy.entity';
import { WeatherSimulator } from './weather-simulator';
import { SolarSimulator } from './solar-simulator';
import { LoadSimulator } from './load-simulator';
import { BatteryController } from './battery-controller';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './simulation-config';

/**
 * Configuration for a specific space
 */
export interface SpaceConfig {
  /** Weather simulator (shared across site) */
  weather: WeatherSimulator;
  /** Solar simulator (if space has solar) */
  solar?: SolarSimulator;
  /** Load simulator */
  load: LoadSimulator;
  /** Battery controller (if space has battery) */
  battery?: BatteryController;
  /** Site configuration reference */
  siteConfig: SiteConfig;
}

/**
 * Space Simulator Class
 * 
 * Simulates leaf-level spaces (zones) independently.
 * Each zone can have its own load profile, subset of solar, etc.
 */
export class SpaceSimulator {
  private config: SpaceConfig;
  private spaceId: string;
  private spaceName: string;
  
  constructor(spaceId: string, spaceName: string, config: SpaceConfig) {
    this.spaceId = spaceId;
    this.spaceName = spaceName;
    this.config = config;
  }
  
  /**
   * Simulate metrics for this space
   */
  public simulate(timestamp: number): SpaceMetrics {
    // 1. Get weather (shared across site)
    const weather = this.config.weather.simulate(timestamp);
    
    // 2. Generate solar (if this space has panels)
    let solarPower = 0;
    if (this.config.solar) {
      const solar = this.config.solar.simulate(timestamp, weather);
      solarPower = solar.acPower;
    }
    
    // 3. Generate loads
    const loads = this.config.load.simulate(timestamp, weather);
    const consumptionPower = loads.totalPower;
    
    // 4. Control battery (if this space has one)
    let batteryPower = 0;
    let batterySoc: number | undefined = undefined;
    
    if (this.config.battery) {
      const energyBalance = {
        solar: solarPower,
        consumption: consumptionPower,
        grid: 0,
      };
      const battery = this.config.battery.control(timestamp, energyBalance, 2000);
      batteryPower = battery.power;
      batterySoc = battery.soc;
    }
    
    // 5. Calculate grid power (balance equation)
    const gridPower = consumptionPower - solarPower - batteryPower;
    
    return {
      solarPower,
      consumptionPower,
      batteryPower,
      gridPower,
      batterySoc,
      breakdown: loads.breakdown,
    };
  }
  
  /**
   * Get space ID
   */
  public getSpaceId(): string {
    return this.spaceId;
  }
  
  /**
   * Get configuration
   */
  public getConfig(): SpaceConfig {
    return this.config;
  }
}

/**
 * Space Simulator Factory
 * 
 * Creates simulators for leaf spaces based on their equipment and characteristics.
 */
export class SpaceSimulatorFactory {
  /**
   * Create simulator for a leaf space (zone)
   */
  public static createForSpace(
    space: HierarchicalSpace,
    siteConfig: SiteConfig,
    weatherSimulator: WeatherSimulator
  ): SpaceSimulator | null {
    // Only create simulators for leaf nodes (zones)
    if (space.type !== SpaceType.ZONE || space.childIds.length > 0) {
      return null;
    }
    
    // Create load simulator based on space equipment
    const loadConfig = {
      baseLoad: (space.equipment.loadCapacity || 20) * 0.3, // 30% base load
      peakLoad: space.equipment.loadCapacity || 20,
      hvac: {
        maxPower: space.equipment.hvacCapacity || (space.equipment.loadCapacity || 20) * 0.4,
        minPower: (space.equipment.hvacCapacity || (space.equipment.loadCapacity || 20) * 0.4) * 0.15,
        setpoint: siteConfig.loads.hvac.setpoint,
        cop: siteConfig.loads.hvac.cop,
      },
      lighting: {
        maxPower: space.equipment.lightingCapacity || (space.equipment.loadCapacity || 20) * 0.25,
        minPower: (space.equipment.lightingCapacity || (space.equipment.loadCapacity || 20) * 0.25) * 0.1,
        occupancyFactor: 0.8,
      },
      equipment: {
        maxPower: space.equipment.equipmentCapacity || (space.equipment.loadCapacity || 20) * 0.25,
        minPower: (space.equipment.equipmentCapacity || (space.equipment.loadCapacity || 20) * 0.25) * 0.4,
        cyclicalUnits: Math.max(1, Math.floor((space.equipment.equipmentCapacity || 5) / 5)), // 1 unit per 5kW
        cycleDuration: 15,
      },
    };
    
    const loadSimulator = new LoadSimulator(loadConfig, siteConfig.businessHours);
    
    // Create solar simulator if space has panels
    let solarSimulator: SolarSimulator | undefined;
    if (space.equipment.solarCapacity && space.equipment.solarCapacity > 0) {
      const solarConfig = {
        ...siteConfig.solar,
        capacity: space.equipment.solarCapacity,
      };
      solarSimulator = new SolarSimulator(
        solarConfig,
        siteConfig.location,
        siteConfig.altitude
      );
    }
    
    // Create battery controller if space has battery
    let batteryController: BatteryController | undefined;
    if (space.equipment.batteryCapacity && space.equipment.batteryCapacity > 0) {
      const batteryConfig = {
        ...siteConfig.storage,
        capacity: space.equipment.batteryCapacity,
        maxPower: space.equipment.batteryMaxPower || space.equipment.batteryCapacity * 0.5,
      };
      batteryController = new BatteryController(batteryConfig, siteConfig.batteryStrategy);
    }
    
    const spaceConfig: SpaceConfig = {
      weather: weatherSimulator,
      solar: solarSimulator,
      load: loadSimulator,
      battery: batteryController,
      siteConfig,
    };
    
    return new SpaceSimulator(space.id, space.name, spaceConfig);
  }
  
  /**
   * Create simulators for all leaf spaces in a hierarchy
   */
  public static createForHierarchy(
    spaces: HierarchicalSpace[],
    siteConfig?: SiteConfig
  ): Map<string, SpaceSimulator> {
    // Use provided config or default
    const config = siteConfig || DEFAULT_SITE_CONFIG;
    const simulators = new Map<string, SpaceSimulator>();
    
    // Create shared weather simulator for the site
    const weatherSimulator = new WeatherSimulator(config.climate);
    
    // Create simulator for each leaf space
    for (const space of spaces) {
      const simulator = this.createForSpace(space, config, weatherSimulator);
      if (simulator) {
        simulators.set(space.id, simulator);
      }
    }
    
    return simulators;
  }
}
