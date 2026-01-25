/**
 * Simulation Configuration
 * 
 * Central configuration for all physics-based simulations.
 * Defines site characteristics, equipment specifications, and control strategies.
 */

import { GeoLocation } from '@/shared/utils/physics';

export interface SolarSystemConfig {
  /** Total installed capacity in kW */
  capacity: number;
  /** Panel efficiency (0-1) */
  efficiency: number;
  /** System degradation factor (0-1) */
  degradation: number;
  /** Panel tilt angle in degrees (0 = flat, 90 = vertical) */
  tiltAngle: number;
  /** Panel azimuth in degrees (0 = north, 180 = south) */
  azimuthAngle: number;
  /** Temperature coefficient (%/°C, typically -0.4 to -0.5) */
  temperatureCoefficient: number;
  /** Inverter efficiency (0-1) */
  inverterEfficiency: number;
}

export interface StorageSystemConfig {
  /** Battery capacity in kWh */
  capacity: number;
  /** Maximum charge/discharge power in kW */
  maxPower: number;
  /** Minimum state of charge (%) */
  minSoc: number;
  /** Maximum state of charge (%) */
  maxSoc: number;
  /** Round-trip efficiency (0-1) */
  efficiency: number;
  /** Self-discharge rate per hour (0-1) */
  selfDischargeRate: number;
  /** Initial state of charge (%) */
  initialSoc: number;
}

export interface LoadConfig {
  /** Base load in kW (always-on systems) */
  baseLoad: number;
  /** Peak load in kW (maximum consumption) */
  peakLoad: number;
  /** HVAC system configuration */
  hvac: {
    /** Maximum HVAC power in kW */
    maxPower: number;
    /** Minimum HVAC power in kW (fans, etc.) */
    minPower: number;
    /** Temperature setpoint in °C */
    setpoint: number;
    /** COP (Coefficient of Performance) */
    cop: number;
  };
  /** Lighting configuration */
  lighting: {
    /** Maximum lighting power in kW */
    maxPower: number;
    /** Minimum lighting power in kW (emergency/security) */
    minPower: number;
    /** Occupancy-driven variation factor (0-1) */
    occupancyFactor: number;
  };
  /** Equipment configuration */
  equipment: {
    /** Maximum equipment power in kW */
    maxPower: number;
    /** Minimum equipment power in kW */
    minPower: number;
    /** Number of cyclical equipment units */
    cyclicalUnits: number;
    /** Average cycle duration in minutes */
    cycleDuration: number;
  };
}

export interface ClimateConfig {
  /** Annual average temperature in °C */
  avgTemperature: number;
  /** Seasonal temperature amplitude in °C */
  seasonalAmplitude: number;
  /** Daily temperature amplitude in °C */
  diurnalAmplitude: number;
  /** Average humidity (%) */
  avgHumidity: number;
  /** Average cloud coverage (0-1) */
  avgCloudCoverage: number;
  /** Cloud persistence (higher = slower cloud changes) */
  cloudPersistence: number;
}

export interface BatteryStrategy {
  /** Strategy mode */
  mode: 'self-consumption' | 'peak-shaving' | 'time-of-use' | 'backup';
  /** Peak shaving threshold in kW (for peak-shaving mode) */
  peakThreshold?: number;
  /** Time-of-use schedule (for time-of-use mode) */
  touSchedule?: {
    chargeHours: number[];  // Hours to charge (0-23)
    dischargeHours: number[]; // Hours to discharge (0-23)
  };
  /** Minimum reserve for backup (%) */
  backupReserve?: number;
}

export interface SiteConfig {
  /** Site identification */
  id: string;
  name: string;
  
  /** Geographic location */
  location: GeoLocation;
  
  /** Site altitude in meters */
  altitude: number;
  
  /** Solar system configuration */
  solar: SolarSystemConfig;
  
  /** Storage system configuration */
  storage: StorageSystemConfig;
  
  /** Load configuration */
  loads: LoadConfig;
  
  /** Climate configuration */
  climate: ClimateConfig;
  
  /** Battery control strategy */
  batteryStrategy: BatteryStrategy;
  
  /** Business hours (for occupancy patterns) */
  businessHours: {
    start: number; // Hour (0-23)
    end: number;   // Hour (0-23)
    weekdaysOnly: boolean;
  };
}

/**
 * Default configuration for Chennai Technology Park
 */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'chennai-tech-park',
  name: 'Chennai Technology Park',
  
  location: {
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
  },
  
  altitude: 16, // meters above sea level
  
  solar: {
    capacity: 500, // kW
    efficiency: 0.20, // 20% panel efficiency
    degradation: 0.98, // 2% annual degradation
    tiltAngle: 13, // Optimal for Chennai latitude
    azimuthAngle: 180, // South-facing
    temperatureCoefficient: -0.0045, // -0.45%/°C
    inverterEfficiency: 0.97,
  },
  
  storage: {
    capacity: 1000, // kWh
    maxPower: 250, // kW
    minSoc: 20, // %
    maxSoc: 95, // %
    efficiency: 0.95, // 95% round-trip
    selfDischargeRate: 0.0001, // 0.01% per hour
    initialSoc: 65, // %
  },
  
  loads: {
    baseLoad: 180, // kW
    peakLoad: 400, // kW
    hvac: {
      maxPower: 160, // kW (40% of peak load)
      minPower: 20, // kW (fans always running)
      setpoint: 24, // °C
      cop: 3.5, // Energy Efficiency Ratio
    },
    lighting: {
      maxPower: 100, // kW (25% of peak load)
      minPower: 10, // kW (security/emergency lighting)
      occupancyFactor: 0.8, // 80% correlation with occupancy
    },
    equipment: {
      maxPower: 100, // kW (25% of peak load)
      minPower: 40, // kW (servers, always-on equipment)
      cyclicalUnits: 20, // Number of equipment items with duty cycles
      cycleDuration: 15, // Average 15-minute cycles
    },
  },
  
  climate: {
    avgTemperature: 29, // °C (Chennai annual average)
    seasonalAmplitude: 4, // °C (relatively small seasonal variation)
    diurnalAmplitude: 8, // °C (typical day-night variation)
    avgHumidity: 70, // %
    avgCloudCoverage: 0.3, // 30% average cloud cover
    cloudPersistence: 0.95, // Clouds change slowly
  },
  
  batteryStrategy: {
    mode: 'self-consumption',
    backupReserve: 20, // Keep 20% for emergencies
  },
  
  businessHours: {
    start: 8,
    end: 18,
    weekdaysOnly: true,
  },
};

/**
 * Get site configuration by ID
 */
export function getSiteConfig(siteId: string): SiteConfig {
  // For now, return default config
  // In future, this would load from a configuration store
  return DEFAULT_SITE_CONFIG;
}

/**
 * Validate site configuration
 */
export function validateSiteConfig(config: SiteConfig): string[] {
  const errors: string[] = [];
  
  // Validate solar config
  if (config.solar.capacity <= 0) {
    errors.push('Solar capacity must be positive');
  }
  if (config.solar.efficiency <= 0 || config.solar.efficiency > 1) {
    errors.push('Solar efficiency must be between 0 and 1');
  }
  
  // Validate storage config
  if (config.storage.capacity <= 0) {
    errors.push('Storage capacity must be positive');
  }
  if (config.storage.minSoc >= config.storage.maxSoc) {
    errors.push('Storage minSoc must be less than maxSoc');
  }
  
  // Validate load config
  if (config.loads.baseLoad > config.loads.peakLoad) {
    errors.push('Base load cannot exceed peak load');
  }
  
  // Validate location
  if (config.location.latitude < -90 || config.location.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  if (config.location.longitude < -180 || config.location.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  return errors;
}
