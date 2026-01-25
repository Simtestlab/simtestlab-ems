/**
 * Domain Entity: Real-time Energy Metrics
 * Represents the core business data for energy monitoring
 */

export interface GridMetrics {
  activePower: number;      // kW (+ = import from grid, - = export to grid)
  voltage: number;          // V
  frequency: number;        // Hz
  reactivePower?: number;   // kVAR
}

export interface SolarMetrics {
  activePower: number;      // kW (current generation)
  dailyYield: number;       // kWh (accumulated today)
  efficiency: number;       // % (0-100)
  irradiance?: number;      // W/m² (solar irradiance)
}

export interface ConsumptionMetrics {
  activePower: number;      // kW (total consumption)
  breakdown: {
    hvac: number;          // kW
    lighting: number;      // kW
    equipment: number;     // kW
    other: number;         // kW
  };
}

export interface StorageMetrics {
  activePower: number;      // kW (+ = charging, - = discharging)
  soc: number;              // % (0-100) State of Charge
  capacity: number;         // kWh (total capacity)
  temperature: number;      // °C
  voltage?: number;         // V
  current?: number;         // A
}

export interface CalculatedMetrics {
  autarchy: number;         // % (energy independence)
  selfConsumption: number;  // % (self-consumed solar energy)
  netEnergy: number;        // kW (net energy balance)
}

/**
 * Complete Real-time Metrics Entity
 */
export interface RealtimeMetrics {
  timestamp: Date;
  grid: GridMetrics;
  solar: SolarMetrics;
  consumption: ConsumptionMetrics;
  storage: StorageMetrics;
  calculated: CalculatedMetrics;
}

/**
 * Time Series Data Point for Charts
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Historical Metrics (Aggregated)
 */
export interface HistoricalMetrics {
  period: Date;
  periodType: 'hour' | 'day' | 'week' | 'month' | 'year';
  energy: {
    gridImport: number;      // kWh
    gridExport: number;      // kWh
    solarGeneration: number; // kWh
    consumption: number;     // kWh
    storageCharge: number;   // kWh
    storageDischarge: number; // kWh
  };
  cost?: {
    gridCost: number;        // Currency
    gridRevenue: number;     // Currency
    netCost: number;         // Currency
  };
  carbon?: {
    avoided: number;         // kg CO2
    consumed: number;        // kg CO2
    net: number;             // kg CO2
  };
}
