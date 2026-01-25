import { EnergyAnalytics, TariffAnalysis, HistoricalDataPoint, TariffRate } from '@/domain/entities/analytics.entity';

// Cache for analytics data with timestamps
interface AnalyticsCache {
  energyAnalytics: EnergyAnalytics | null;
  tariffAnalysis: TariffAnalysis | null;
  lastEnergyUpdate: number;
  lastTariffUpdate: number;
}

const analyticsCache: AnalyticsCache = {
  energyAnalytics: null,
  tariffAnalysis: null,
  lastEnergyUpdate: 0,
  lastTariffUpdate: 0,
};

// Update intervals (in milliseconds)
const UPDATE_INTERVALS = {
  ENERGY_ANALYTICS: 5 * 60 * 1000,  // 5 minutes - energy analysis updates every 5 minutes
  TARIFF_ANALYSIS: 15 * 60 * 1000,  // 15 minutes - billing analysis updates every 15 minutes
};

// Indian electricity tariff structure (typical commercial rates)
const TARIFF_SCHEDULE: TariffRate[] = [
  { name: 'Off-Peak', startHour: 0, endHour: 6, rate: 5.5, type: 'off-peak' },
  { name: 'Mid-Peak', startHour: 6, endHour: 9, rate: 7.0, type: 'mid-peak' },
  { name: 'Peak', startHour: 9, endHour: 11, rate: 9.5, type: 'peak' },
  { name: 'Mid-Peak', startHour: 11, endHour: 18, rate: 7.0, type: 'mid-peak' },
  { name: 'Peak', startHour: 18, endHour: 22, rate: 9.5, type: 'peak' },
  { name: 'Off-Peak', startHour: 22, endHour: 24, rate: 5.5, type: 'off-peak' },
];

function getCurrentTariff(): TariffRate {
  const currentHour = new Date().getHours();
  return TARIFF_SCHEDULE.find(t => currentHour >= t.startHour && currentHour < t.endHour) || TARIFF_SCHEDULE[0];
}

function generateHistoricalData(days: number = 30): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0);

    // Generate realistic patterns
    const baseConsumption = 200 + Math.random() * 100;
    const baseSolar = 150 + Math.random() * 80;
    const baseGrid = Math.max(0, baseConsumption - baseSolar + (Math.random() - 0.5) * 50);

    data.push(
      { timestamp: new Date(date), value: baseConsumption, category: 'consumption' },
      { timestamp: new Date(date), value: baseSolar, category: 'solar' },
      { timestamp: new Date(date), value: baseGrid, category: 'grid' }
    );
  }

  return data;
}

export function generateEnergyAnalytics(currentMetrics: { consumption: number; solar: number; grid: number }): EnergyAnalytics {
  // Check cache and return if still valid
  const now = Date.now();
  if (analyticsCache.energyAnalytics && (now - analyticsCache.lastEnergyUpdate) < UPDATE_INTERVALS.ENERGY_ANALYTICS) {
    return analyticsCache.energyAnalytics;
  }

  // Generate fresh analytics (only every 5 minutes)
  const todayConsumption = currentMetrics.consumption * 24; // Rough daily estimate
  const yesterdayConsumption = todayConsumption * (0.95 + Math.random() * 0.1);
  const weekConsumption = todayConsumption * 7 * (0.98 + Math.random() * 0.04);
  const lastWeekConsumption = weekConsumption * (0.96 + Math.random() * 0.08);
  const monthConsumption = todayConsumption * 30 * (0.97 + Math.random() * 0.06);
  const lastMonthConsumption = monthConsumption * (0.94 + Math.random() * 0.12);

  const peakDemand = currentMetrics.consumption * 1.2;
  const peakDemandTime = new Date();
  peakDemandTime.setHours(14, 30, 0, 0);

  const averageLoadFactor = 0.65 + Math.random() * 0.15;

  const result: EnergyAnalytics = {
    todayConsumption,
    yesterdayConsumption,
    weekConsumption,
    lastWeekConsumption,
    monthConsumption,
    lastMonthConsumption,
    peakDemand,
    peakDemandTime,
    averageLoadFactor,
    trends: {
      daily: {
        period: 'day',
        current: todayConsumption,
        previous: yesterdayConsumption,
        change: ((todayConsumption - yesterdayConsumption) / yesterdayConsumption) * 100,
        isPositive: todayConsumption < yesterdayConsumption,
      },
      weekly: {
        period: 'week',
        current: weekConsumption,
        previous: lastWeekConsumption,
        change: ((weekConsumption - lastWeekConsumption) / lastWeekConsumption) * 100,
        isPositive: weekConsumption < lastWeekConsumption,
      },
      monthly: {
        period: 'month',
        current: monthConsumption,
        previous: lastMonthConsumption,
        change: ((monthConsumption - lastMonthConsumption) / lastMonthConsumption) * 100,
        isPositive: monthConsumption < lastMonthConsumption,
      },
    },
    historicalData: generateHistoricalData(30),
  };
  
  // Cache the result with timestamp
  analyticsCache.energyAnalytics = result;
  analyticsCache.lastEnergyUpdate = now;
  
  return result;
}

export function generateTariffAnalysis(
  currentMetrics: { consumption: number; solar: number; grid: number },
  analytics: EnergyAnalytics
): TariffAnalysis {
  // Check cache and return if still valid
  const now = Date.now();
  if (analyticsCache.tariffAnalysis && (now - analyticsCache.lastTariffUpdate) < UPDATE_INTERVALS.TARIFF_ANALYSIS) {
    return analyticsCache.tariffAnalysis;
  }

  // Generate fresh tariff analysis (only every 15 minutes)
  const currentRate = getCurrentTariff();
  
  // Calculate costs
  const todayCost = analytics.todayConsumption * 6.5; // Average rate
  const monthToDateCost = (analytics.monthConsumption / 30) * new Date().getDate() * 6.5;
  const projectedMonthCost = analytics.monthConsumption * 6.5;

  // Savings calculation (assuming 70% solar contribution)
  const gridOnlyCost = analytics.monthConsumption * 8.0; // Grid-only rate higher
  const savingsVsGrid = gridOnlyCost - projectedMonthCost;
  const savingsPercentage = (savingsVsGrid / gridOnlyCost) * 100;

  // Demand charges (₹300 per kW for peak demand)
  const demandCharge = analytics.peakDemand * 300;
  const peakDemandCost = demandCharge;

  // Billing projection
  const energyCharges = projectedMonthCost;
  const demandCharges = demandCharge;
  const fixedCharges = 5000; // Fixed monthly charges
  const taxes = (energyCharges + demandCharges + fixedCharges) * 0.18; // 18% GST
  const total = energyCharges + demandCharges + fixedCharges + taxes;

  // Cost breakdown
  const solarEnergy = analytics.monthConsumption * 0.7;
  const gridEnergy = analytics.monthConsumption * 0.3;
  const batteryContribution = analytics.monthConsumption * 0.15;

  const result: TariffAnalysis = {
    currentRate,
    todayCost,
    monthToDateCost,
    projectedMonthCost,
    savingsVsGrid,
    savingsPercentage,
    demandCharge,
    peakDemandCost,
    billing: {
      energyCharges,
      demandCharges,
      fixedCharges,
      taxes,
      total,
      projectedMonthly: total,
    },
    tariffSchedule: TARIFF_SCHEDULE,
    costBreakdown: {
      solar: solarEnergy * 2.5, // Cost saved by using solar
      grid: gridEnergy * 8.0,
      battery: batteryContribution * 4.0,
    },
  };
  
  // Cache the result with timestamp
  analyticsCache.tariffAnalysis = result;
  analyticsCache.lastTariffUpdate = now;
  
  return result;
}

/**
 * Force refresh analytics (useful for testing or manual refresh)
 */
export function refreshAnalytics(): void {
  analyticsCache.energyAnalytics = null;
  analyticsCache.tariffAnalysis = null;
  analyticsCache.lastEnergyUpdate = 0;
  analyticsCache.lastTariffUpdate = 0;
}
