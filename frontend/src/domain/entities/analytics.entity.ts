export interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  category: 'consumption' | 'solar' | 'grid' | 'cost';
}

export interface TrendComparison {
  period: 'day' | 'week' | 'month' | 'year';
  current: number;
  previous: number;
  change: number; // percentage
  isPositive: boolean;
}

export interface EnergyAnalytics {
  todayConsumption: number;
  yesterdayConsumption: number;
  weekConsumption: number;
  lastWeekConsumption: number;
  monthConsumption: number;
  lastMonthConsumption: number;
  peakDemand: number;
  peakDemandTime: Date;
  averageLoadFactor: number;
  trends: {
    daily: TrendComparison;
    weekly: TrendComparison;
    monthly: TrendComparison;
  };
  historicalData: HistoricalDataPoint[];
  consumptionBreakdown?: {
    hvac: number;
    lighting: number;
    equipment: number;
    other: number;
  };
}

export interface TariffRate {
  name: string;
  startHour: number;
  endHour: number;
  rate: number; // ₹ per kWh
  type: 'peak' | 'off-peak' | 'mid-peak';
}

export interface BillingProjection {
  energyCharges: number;
  demandCharges: number;
  fixedCharges: number;
  taxes: number;
  total: number;
  projectedMonthly: number;
}

export interface TariffAnalysis {
  currentRate: TariffRate;
  todayCost: number;
  monthToDateCost: number;
  projectedMonthCost: number;
  savingsVsGrid: number;
  savingsPercentage: number;
  demandCharge: number;
  peakDemandCost: number;
  billing: BillingProjection;
  tariffSchedule: TariffRate[];
  costBreakdown: {
    solar: number;
    grid: number;
    battery: number;
  };
}
