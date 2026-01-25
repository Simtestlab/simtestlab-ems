/**
 * Mock Data Generator for Real-time Metrics
 * Generates realistic EMS data with physics-based simulations
 */

import { RealtimeMetrics } from '@/domain/entities/metrics.entity';
import { timeEngine } from '@/infrastructure/time/time-engine';
import { TimeSeriesStore } from '@/infrastructure/time/time-series-store';
import { AggregationMethod } from '@/domain/entities/time-series.entity';
import { WeatherSimulator } from '@/infrastructure/simulation/weather-simulator';
import { SolarSimulator } from '@/infrastructure/simulation/solar-simulator';
import { LoadSimulator } from '@/infrastructure/simulation/load-simulator';
import { BatteryController } from '@/infrastructure/simulation/battery-controller';
import { DEFAULT_SITE_CONFIG } from '@/infrastructure/simulation/simulation-config';

/**
 * Grid configuration
 */
const GRID_CONFIG = {
  voltage: 400,         // V
  frequency: 50,        // Hz
};

/**
 * Main mock data generator with physics-based simulation and time-series storage
 */
export class MockMetricsGenerator {
  private config = DEFAULT_SITE_CONFIG;
  private lastTimestamp: number;
  private lastValidSelfConsumption: number = 0;
  
  // Physics-based simulators
  private weatherSimulator: WeatherSimulator;
  private solarSimulator: SolarSimulator;
  private loadSimulator: LoadSimulator;
  private batteryController: BatteryController;
  
  // Time-series stores for historical data
  private solarStore: TimeSeriesStore<number>;
  private consumptionStore: TimeSeriesStore<number>;
  private gridStore: TimeSeriesStore<number>;
  private storageStore: TimeSeriesStore<number>;
  private socStore: TimeSeriesStore<number>;
  
  // Time engine subscription
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.lastTimestamp = timeEngine.getCurrentTime();
    
    // Initialize physics-based simulators
    this.weatherSimulator = new WeatherSimulator(this.config.climate);
    this.solarSimulator = new SolarSimulator(
      this.config.solar,
      this.config.location,
      this.config.altitude
    );
    this.loadSimulator = new LoadSimulator(
      this.config.loads,
      this.config.businessHours
    );
    this.batteryController = new BatteryController(
      this.config.storage,
      this.config.batteryStrategy
    );
    
    // Initialize time-series stores with 7-day retention
    const storeConfig = {
      maxPoints: 10000,
      retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationMethod: AggregationMethod.AVERAGE,
    };
    
    this.solarStore = new TimeSeriesStore(storeConfig);
    this.consumptionStore = new TimeSeriesStore(storeConfig);
    this.gridStore = new TimeSeriesStore(storeConfig);
    this.storageStore = new TimeSeriesStore(storeConfig);
    this.socStore = new TimeSeriesStore(storeConfig);
    
    // Subscribe to time engine updates
    this.subscribeToTimeEngine();
  }
  
  /**
   * Subscribe to time engine for automatic updates
   */
  private subscribeToTimeEngine(): void {
    this.unsubscribe = timeEngine.subscribe((currentTime) => {
      // Store historical data point whenever time advances
      this.lastTimestamp = currentTime;
    });
  }
  
  /**
   * Unsubscribe from time engine (cleanup)
   */
  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  /**
   * Generate realistic real-time metrics using physics-based simulation
   */
  generateMetrics(): RealtimeMetrics {
    // Use time engine instead of Date.now()
    const currentTime = timeEngine.getCurrentTime();
    const now = new Date(currentTime);
    
    // 1. Simulate weather conditions
    const weather = this.weatherSimulator.simulate(currentTime);
    
    // 2. Simulate solar generation
    const solar = this.solarSimulator.simulate(currentTime, weather);
    
    // 3. Simulate building loads
    const loads = this.loadSimulator.simulate(currentTime, weather);
    
    // 4. Control battery based on energy balance
    const energyBalance = {
      solar: solar.acPower,
      consumption: loads.totalPower,
      grid: 0, // Will be calculated
    };
    const battery = this.batteryController.control(currentTime, energyBalance, 2000);
    
    // 5. Calculate grid power (balance equation)
    const gridPower = loads.totalPower - solar.acPower - battery.power;
    
    // 6. Calculate efficiency metrics
    const { autarchy, selfConsumption } = this.calculateEfficiencyMetrics(
      solar.acPower,
      loads.totalPower,
      gridPower,
      battery.power
    );
    
    // Keep last valid self-consumption during nighttime
    if (selfConsumption > 0) {
      this.lastValidSelfConsumption = selfConsumption;
    }
    const displaySelfConsumption = solar.acPower > 0.1 ? selfConsumption : this.lastValidSelfConsumption;
    
    // Store historical data points
    this.solarStore.addPoint({ timestamp: currentTime, value: solar.acPower });
    this.consumptionStore.addPoint({ timestamp: currentTime, value: loads.totalPower });
    this.gridStore.addPoint({ timestamp: currentTime, value: gridPower });
    this.storageStore.addPoint({ timestamp: currentTime, value: battery.power });
    this.socStore.addPoint({ timestamp: currentTime, value: battery.soc });
    
    return {
      timestamp: now,
      grid: {
        activePower: gridPower,
        voltage: GRID_CONFIG.voltage + (Math.random() - 0.5) * 5,
        frequency: GRID_CONFIG.frequency + (Math.random() - 0.5) * 0.1,
      },
      solar: {
        activePower: solar.acPower,
        dailyYield: this.calculateDailyYield(currentTime),
        efficiency: solar.efficiency,
        irradiance: solar.irradiance,
      },
      consumption: {
        activePower: loads.totalPower,
        breakdown: loads.breakdown,
      },
      storage: {
        activePower: battery.power,
        soc: battery.soc,
        capacity: this.config.storage.capacity,
        temperature: battery.temperature,
        voltage: battery.voltage,
        current: battery.current,
      },
      calculated: {
        autarchy,
        selfConsumption: displaySelfConsumption,
        netEnergy: -gridPower,
      },
    };
  }
  
  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(
    solar: number,
    consumption: number,
    grid: number,
    storage: number
  ): { autarchy: number; selfConsumption: number } {
    let autarchy = 0;
    let selfConsumption = 0;
    
    // Autarchy: percentage of consumption met by local generation (not from grid)
    if (consumption > 1) {
      const gridImport = Math.max(0, grid);
      autarchy = Math.max(0, Math.min(100, ((consumption - gridImport) / consumption) * 100));
    }
    
    // Self-consumption: percentage of solar power used locally (not exported to grid)
    if (solar > 0.1) {
      const gridExport = Math.max(0, -grid);
      selfConsumption = Math.max(0, Math.min(100, ((solar - gridExport) / solar) * 100));
    }
    
    return { autarchy, selfConsumption };
  }
  
  /**
   * Calculate accumulated daily solar yield
   */
  private calculateDailyYield(timestamp: number): number {
    const date = new Date(timestamp);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = timestamp;
    
    // Query solar time-series for today
    const result = this.solarStore.query({
      range: { start: startOfDay, end: endOfDay },
      aggregation: AggregationMethod.AVERAGE,
    });
    
    if (result.points.length === 0) return 0;
    
    // Integrate power over time (trapezoidal rule)
    let totalEnergy = 0;
    for (let i = 1; i < result.points.length; i++) {
      const dt = (result.points[i].timestamp - result.points[i - 1].timestamp) / (1000 * 60 * 60); // hours
      const avgPower = (result.points[i].value + result.points[i - 1].value) / 2;
      totalEnergy += avgPower * dt;
    }
    
    return totalEnergy;
  }
  
  /**
   * Get historical data for a specific metric
   */
  getHistoricalData(
    metric: 'solar' | 'consumption' | 'grid' | 'storage' | 'soc',
    startTime: number,
    endTime: number,
    maxPoints?: number
  ) {
    const store = this.getStore(metric);
    return store.query({
      range: { start: startTime, end: endTime },
      maxPoints,
      aggregation: AggregationMethod.AVERAGE,
    });
  }
  
  /**
   * Get the appropriate store for a metric
   */
  private getStore(metric: 'solar' | 'consumption' | 'grid' | 'storage' | 'soc'): TimeSeriesStore<number> {
    switch (metric) {
      case 'solar':
        return this.solarStore;
      case 'consumption':
        return this.consumptionStore;
      case 'grid':
        return this.gridStore;
      case 'storage':
        return this.storageStore;
      case 'soc':
        return this.socStore;
    }
  }
  
  /**
   * Get statistics for all stores
   */
  getStorageStats() {
    return {
      solar: this.solarStore.getStats(),
      consumption: this.consumptionStore.getStats(),
      grid: this.gridStore.getStats(),
      storage: this.storageStore.getStats(),
      soc: this.socStore.getStats(),
    };
  }
  
  /**
   * Reset SOC to a specific value
   */
  resetSoc(soc: number): void {
    this.batteryController.setSoc(soc);
  }
}

/**
 * Singleton instance
 */
export const mockMetricsGenerator = new MockMetricsGenerator();
