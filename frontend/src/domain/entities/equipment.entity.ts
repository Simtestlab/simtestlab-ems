/**
 * Domain Entity: Equipment
 * Represents physical equipment assets within an energy system
 */

export type EquipmentStatus = 'online' | 'offline' | 'fault' | 'warning' | 'maintenance';
export type MeterType = 'grid' | 'load' | 'generation' | 'storage';

/**
 * Inverter Entity
 */
export interface Inverter {
  id: string;
  siteId: string;
  name: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  
  // Power metrics
  activePower: number;      // kW (current output)
  reactivePower?: number;   // kVAR
  efficiency: number;       // % (current efficiency)
  powerFactor?: number;     // 0-1
  
  // Environmental
  temperature: number;      // °C
  
  // Production
  dailyYield: number;       // kWh (today)
  totalYield: number;       // kWh (lifetime)
  
  // MPPT (Maximum Power Point Tracking)
  mpptCount: number;
  mpptData?: MPPTData[];
  
  // Grid connection
  gridVoltage?: number;     // V
  gridFrequency?: number;   // Hz
  gridCurrent?: number;     // A
  
  // Communication
  lastCommunication: Date;
  communicationStatus: 'online' | 'offline';
  
  // Operational
  startupTime?: Date;
  runningHours?: number;
  
  // Alarms
  alarms: string[];
  faults: string[];
  
  metadata?: {
    manufacturer?: string;
    installationDate?: Date;
    warrantyExpiry?: Date;
    location?: string;      // Within site (e.g., "Building A - Roof")
  };
}

/**
 * MPPT (Maximum Power Point Tracker) Data
 */
export interface MPPTData {
  id: number;               // MPPT number (1-28)
  voltage: number;          // V (DC voltage)
  current: number;          // A (DC current)
  power: number;            // kW (calculated)
  status: 'active' | 'inactive' | 'fault';
}

/**
 * Meter Entity
 */
export interface Meter {
  id: string;
  siteId: string;
  type: MeterType;
  name: string;
  model?: string;
  serialNumber?: string;
  status: EquipmentStatus;
  
  // Electrical metrics
  activePower: number;      // kW
  reactivePower?: number;   // kVAR
  apparentPower?: number;   // kVA
  powerFactor?: number;     // 0-1
  
  // Voltage (3-phase)
  voltageL1?: number;       // V (Phase 1)
  voltageL2?: number;       // V (Phase 2)
  voltageL3?: number;       // V (Phase 3)
  voltageAvg?: number;      // V (Average)
  
  // Current (3-phase)
  currentL1?: number;       // A (Phase 1)
  currentL2?: number;       // A (Phase 2)
  currentL3?: number;       // A (Phase 3)
  currentAvg?: number;      // A (Average)
  
  // Frequency
  frequency?: number;       // Hz
  
  // Energy (cumulative)
  energyImport?: number;    // kWh (imported)
  energyExport?: number;    // kWh (exported)
  energyNet?: number;       // kWh (net)
  
  // Daily metrics
  dailyImport?: number;     // kWh
  dailyExport?: number;     // kWh
  
  // Communication
  lastCommunication: Date;
  communicationStatus: 'online' | 'offline';
  
  metadata?: {
    manufacturer?: string;
    installationDate?: Date;
    calibrationDate?: Date;
    location?: string;
  };
}

/**
 * Battery/BESS (Battery Energy Storage System) Entity
 */
export interface Battery {
  id: string;
  siteId: string;
  name: string;
  model?: string;
  serialNumber?: string;
  status: EquipmentStatus;
  
  // State
  soc: number;              // % (State of Charge, 0-100)
  soh: number;              // % (State of Health, 0-100)
  
  // Power
  activePower: number;      // kW (+ = charging, - = discharging)
  maxChargePower: number;   // kW (max charging rate)
  maxDischargePower: number; // kW (max discharging rate)
  
  // Capacity
  totalCapacity: number;    // kWh (rated capacity)
  availableCapacity: number; // kWh (usable capacity)
  
  // Electrical
  voltage: number;          // V (DC voltage)
  current: number;          // A (DC current)
  
  // Environmental
  temperature: number;      // °C (average)
  temperatureMin?: number;  // °C (minimum cell)
  temperatureMax?: number;  // °C (maximum cell)
  
  // Operational
  cycleCount: number;       // Number of charge/discharge cycles
  dailyThroughput?: number; // kWh (energy cycled today)
  totalThroughput?: number; // kWh (lifetime energy cycled)
  
  // Cell data (if BMS provides)
  cellCount?: number;
  cellVoltageMin?: number;  // V (lowest cell voltage)
  cellVoltageMax?: number;  // V (highest cell voltage)
  cellVoltageDelta?: number; // V (difference)
  
  // Communication
  lastCommunication: Date;
  communicationStatus: 'online' | 'offline';
  
  // Alarms
  alarms: string[];
  
  metadata?: {
    manufacturer?: string;
    chemistry?: string;     // e.g., "LiFePO4", "NMC"
    installationDate?: Date;
    warrantyExpiry?: Date;
    rackLocation?: string;
  };
}

/**
 * Equipment Summary (for aggregated views)
 */
export interface EquipmentSummary {
  siteId: string;
  inverters: {
    total: number;
    online: number;
    offline: number;
    fault: number;
    totalPower: number;     // kW
    avgEfficiency: number;  // %
  };
  meters: {
    total: number;
    online: number;
    offline: number;
  };
  batteries: {
    total: number;
    online: number;
    offline: number;
    avgSoc: number;         // %
    avgSoh: number;         // %
    totalPower: number;     // kW
  };
}
