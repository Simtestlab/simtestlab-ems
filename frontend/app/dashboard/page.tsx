'use client';

import { Zap, Sun, Home, Battery, Leaf, TrendingUp, MapPin, Lightbulb, TrendingDown, AlertTriangle, Activity, DollarSign } from 'lucide-react';
import { useLiveTelemetry } from '@/presentation/hooks/useLiveTelemetry.api';
import { useEnergyMetrics } from '@/presentation/hooks/useEnergyMetrics.api';
import { useBusinessMetrics } from '@/presentation/hooks/useBusinessMetrics.api';
import { useRealtimeSiteMetrics } from '@/presentation/hooks/useRealtimeSiteMetrics.api';
import { useWeather } from '@/presentation/hooks/useWeather.api';
import { useAnalytics } from '@/presentation/hooks/useAnalytics.api';
import { useTariff } from '@/presentation/hooks/useTariff.api';
import { useAlerts } from '@/presentation/hooks/useAlerts.api';
import { useBackendHealth } from '@/presentation/hooks/useBackendHealth';
import { formatPower, formatPercentage, formatTimestamp, getGridStatusText, getStorageStatusText } from '@/shared/utils/formatting';
import { METRIC_COLORS, getGridColor, getStorageColor } from '@/shared/constants/colors';
import RealtimeChart from '@/presentation/components/features/RealtimeChart';
import DashboardHeader from '@/presentation/components/features/DashboardHeader';
import DashboardFooter from '@/presentation/components/features/DashboardFooter';
import SummaryCard from '@/presentation/components/features/SummaryCard';
import SiteComparisonCard from '@/presentation/components/features/SiteComparisonCard';
import SiteWiseEnergyFlow from '@/presentation/components/features/SiteWiseEnergyFlow';
import AlertsPanel from '@/presentation/components/features/AlertsPanel';
import WeatherWidget from '@/presentation/components/features/WeatherWidget';
import EnergyAnalyticsPanel from '@/presentation/components/features/EnergyAnalyticsPanel';
import TariffAnalysisPanel from '@/presentation/components/features/TariffAnalysisPanel';
import BackendConnectionError from '@/presentation/components/features/BackendConnectionError';
import dynamic from 'next/dynamic';
import { mockSpaces } from '@/infrastructure/mock/spaces.mock';
import { getEquipmentForSite } from '@/infrastructure/mock/equipment.mock';
import { useState, useEffect, useMemo } from 'react';
import { mergeSiteMetrics } from '@/shared/utils/site-metrics';
import MapLegend from '@/presentation/components/features/map/MapLegend';
import SiteDetailPanel from '@/presentation/components/features/map/SiteDetailPanel';
import { Atom } from 'react-loading-indicators';

// Dynamically import map to avoid SSR issues with Leaflet
const SitesMap = dynamic(
  () => import('@/presentation/components/features/SitesMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
);

export default function DashboardPage() {
  /**
   * MULTI-RATE UPDATE ARCHITECTURE
   * Following real EMS/SCADA industry patterns:
   * 
   * 1. Live Telemetry (1-2s): Instantaneous power, real-time charts
   * 2. Energy Metrics (30-60s): Accumulated energy, SOC, operational metrics
   * 3. Business Metrics (5-15min): Peak power, cost, carbon, health scores
   */

  // Check backend health first
  const { isHealthy, isChecking } = useBackendHealth(5000);

  const {
    telemetry,
    chartData,
    isLoading: isLoadingTelemetry
  } = useLiveTelemetry(30, 2000);

  // MEDIUM-FREQUENCY: Energy accumulation metrics (30 seconds)
  // Used for: Energy Today, SOC, aggregated values
  const {
    metrics: energyMetrics,
    isLoading: isLoadingEnergy
  } = useEnergyMetrics(30000);

  // LOW-FREQUENCY: Business metrics (5 minutes)
  // Used for: Peak power, cost savings, carbon, system health, alerts
  const {
    metrics: businessMetrics,
    isLoading: isLoadingBusiness
  } = useBusinessMetrics(300000);

  // Weather data (60 seconds - low frequency updates)
  const { weather } = useWeather(60000);

  // Analytics data (30 seconds)
  const { analytics } = useAnalytics(30000);

  // Tariff analysis (30 seconds)
  const { tariff } = useTariff(30000);

  // Alerts (5 seconds - for real-time alert updates)
  const { alerts, stats: alertStats, acknowledgeAlert } = useAlerts(5000);

  // Site-level metrics for map (2 seconds - for status indicators)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // Get site-level spaces
  const staticSites = useMemo(() => mockSpaces.filter(space => space.type === 'site'), []);

  // Real-time site metrics for map
  const { siteMetrics, lastUpdate } = useRealtimeSiteMetrics(staticSites, 2000);

  // Merge live metrics with static site data
  const sites = useMemo(() =>
    mergeSiteMetrics(staticSites, siteMetrics),
    [staticSites, siteMetrics]
  );

  // Loading state - wait for initial data from all hooks
  const isLoading = isLoadingTelemetry || isLoadingEnergy || isLoadingBusiness;

  // Get the current selected site with live data
  const selectedSite = useMemo(() =>
    selectedSiteId ? sites.find(s => s.id === selectedSiteId) || null : null,
    [selectedSiteId, sites]
  );

  // Update timestamp display (from live telemetry for accurate real-time feel)
  useEffect(() => {
    if (telemetry) {
      setLastUpdateTime(formatTimestamp(telemetry.timestamp, 'time'));
    }
  }, [telemetry]);

  // Get equipment for selected site
  const selectedSiteEquipment = selectedSite
    ? getEquipmentForSite(selectedSite.id)
    : null;

  // Show backend connection error if health check fails
  if (isHealthy === false) {
    return <BackendConnectionError />;
  }

  // Show loading while health check is in progress
  if (isChecking) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white min-h-screen">
        <div className="text-center space-y-4">
          <Atom color="#ff0000ff" size="medium" text="" textColor="" />
          <p className="text-gray-900 mt-4">Checking backend connection...</p>
          <p className="text-gray-600 text-sm mt-2">Crafted with ❤️ by Simtestlab Sweden AB</p>
        </div>
      </div>
    );
  }

  // KPI values - sourced from appropriate update frequencies
  // Energy metrics (30s updates) - stable, no flicker
  const dailyEnergy = energyMetrics?.solarEnergyToday || 0;
  const batterySoc = energyMetrics?.batterySoc || 0;
  const autarchy = energyMetrics?.autarchy || 0;
  const selfConsumption = energyMetrics?.selfConsumption || 0;

  // Business metrics (5min updates) - strategic KPIs
  const peakPower = businessMetrics?.peakPower || 0;
  const costSavings = businessMetrics?.costSavings || 0;
  const carbonAvoided = businessMetrics?.carbonAvoided || 0;
  const systemHealth = businessMetrics?.systemHealth || 0;
  const activeAlerts = alertStats?.total || 0; // Use real alert count from API

  // Live telemetry (2s updates) - for real-time displays and charts
  const gridPower = telemetry?.gridPower || 0;
  const solarPower = telemetry?.solarPower || 0;
  const consumptionPower = telemetry?.consumptionPower || 0;
  const batteryPower = telemetry?.batteryPower || 0;

  // Consumption breakdown from analytics API
  const consumptionBreakdown = analytics?.consumptionBreakdown || {
    hvac: consumptionPower * 0.4,
    lighting: consumptionPower * 0.2,
    equipment: consumptionPower * 0.3,
    other: consumptionPower * 0.1,
  };

  return (
    <>
      <DashboardHeader />

      <main className="flex-1 w-full px-6 py-6 space-y-6 bg-white">
        {/* Live Status Bar */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-900">LIVE</span>
              <span className="text-xs text-gray-600">Last Updated: {lastUpdateTime || '--:--:--'}</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-medium text-gray-900">{sites.length} Sites Active</span>
            </div>
          </div>
          <span className="text-sm text-gray-600">Portfolio Real-time Monitoring</span>
        </div>

        {/* Portfolio Overview Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
            <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <span className="text-sm font-semibold text-blue-700">{sites.length} Sites</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Aggregated metrics consolidated across all active sites</p>
        </div>

        {/* Summary KPI Cards - Portfolio Level */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            title="Energy Today"
            value={dailyEnergy}
            unit="kWh"
            icon={Lightbulb}
            color="blue"
            decimals={0}
          />
          <SummaryCard
            title="Peak Power"
            value={peakPower}
            unit="kW"
            icon={TrendingUp}
            color="orange"
            decimals={1}
          />
          <SummaryCard
            title="Cost Savings"
            value={costSavings}
            unit="₹"
            icon={DollarSign}
            color="green"
            trend={{ value: 12.5, isPositive: true }}
            decimals={0}
          />
          <SummaryCard
            title="Carbon Avoided"
            value={carbonAvoided}
            unit="kg CO₂"
            icon={Leaf}
            color="green"
            decimals={1}
          />
          <SummaryCard
            title="System Health"
            value={systemHealth}
            unit="%"
            icon={Activity}
            color="cyan"
            decimals={0}
          />
          <SummaryCard
            title="Active Alerts"
            value={activeAlerts}
            unit="alerts"
            icon={AlertTriangle}
            color={activeAlerts > 0 ? 'red' : 'purple'}
            decimals={0}
          />
        </div>

        {/* Charts Section Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Real-Time Power Trends</h3>
          <p className="text-sm text-gray-600">Aggregated telemetry from all {sites.length} sites · Updated every 2 seconds</p>
        </div>

        {/* Charts Section - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grid Power Chart */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" style={{ color: getGridColor(gridPower) }} />
                  <h3 className="font-semibold text-gray-900">Grid Power</h3>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${getGridColor(gridPower)}20`,
                    color: getGridColor(gridPower)
                  }}
                >
                  {getGridStatusText(gridPower)}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPower(gridPower, 1)}</p>
            </div>
            <div className="h-56 p-4">
              <RealtimeChart
                data={chartData.grid}
                color={getGridColor(gridPower)}
                title="Grid"
                metricType="grid"
                unit="kW"
                timeWindow="realtime"
              />
            </div>
          </div>

          {/* Solar Production Chart */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5" style={{ color: METRIC_COLORS.solar.primary }} />
                  <h3 className="font-semibold text-gray-900">Solar Production</h3>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${METRIC_COLORS.solar.primary}20`,
                    color: METRIC_COLORS.solar.primary
                  }}
                >
                  GENERATING
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPower(solarPower, 1)}</p>
              <p className="text-xs text-gray-600">Today: {formatPower(dailyEnergy, 0)}h</p>
            </div>
            <div className="h-56 p-4">
              <RealtimeChart
                data={chartData.solar}
                color={METRIC_COLORS.solar.primary}
                title="Solar"
                metricType="solar"
                unit="kW"
                timeWindow="realtime"
              />
            </div>
          </div>

          {/* Consumption Chart */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5" style={{ color: METRIC_COLORS.consumption.primary }} />
                  <h3 className="font-semibold text-gray-900">Total Consumption</h3>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${METRIC_COLORS.consumption.primary}20`,
                    color: METRIC_COLORS.consumption.primary
                  }}
                >
                  ACTIVE
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPower(consumptionPower, 1)}</p>
              <p className="text-xs text-gray-600">Total load</p>
            </div>
            <div className="h-56 p-4">
              <RealtimeChart
                data={chartData.consumption}
                color={METRIC_COLORS.consumption.primary}
                title="Consumption"
                metricType="consumption"
                unit="kW"
                timeWindow="realtime"
              />
            </div>
          </div>

          {/* Storage Chart */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5" style={{ color: getStorageColor(batteryPower) }} />
                  <h3 className="font-semibold text-gray-900">Energy Storage</h3>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${getStorageColor(batteryPower)}20`,
                    color: getStorageColor(batteryPower)
                  }}
                >
                  {getStorageStatusText(batteryPower)}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(batterySoc, 0)}</p>
              <p className="text-xs text-gray-600">{formatPower(Math.abs(batteryPower), 1)}</p>
            </div>
            <div className="h-56 p-4">
              <RealtimeChart
                data={chartData.storage}
                color={getStorageColor(batteryPower)}
                title="Storage"
                metricType="storage"
                unit="kW"
                timeWindow="realtime"
              />
            </div>
          </div>
        </div>

        {/* Aggregated Sites Summary */}
        <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Multi-Site Aggregation</h3>
              <p className="text-xs text-gray-600">Dashboard metrics consolidated from all active sites</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 rounded-full">
              <span className="text-xs font-bold text-blue-700">{sites.length} Sites</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Total Solar Capacity</p>
              <p className="text-lg font-bold text-orange-600">
                {sites.reduce((sum, site) => sum + (site.capacity.solar || 0), 0).toFixed(1)} kW
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Total Battery Capacity</p>
              <p className="text-lg font-bold text-green-600">
                {sites.reduce((sum, site) => sum + (site.capacity.storage || 0), 0).toFixed(1)} kWh
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Active Sites</p>
              <p className="text-lg font-bold text-blue-600">
                {sites.filter(s => s.metrics?.status === 'online').length} / {sites.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Avg System Efficiency</p>
              <p className="text-lg font-bold text-purple-600">
                {(sites.reduce((sum, site) => sum + (site.metrics?.efficiency || 0), 0) / sites.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Map Section with Legend and Detail Panel */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Sites Map</h3>
                </div>
                <p className="text-xs text-gray-600 ml-7">Individual site telemetry · Click markers for detailed view</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{sites.length} Active Sites</span>
                {/* Live Update Indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md border border-green-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-700">LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flexbox Container for Map, Legend, and Detail Panel */}
          <div className="flex flex-col lg:flex-row gap-4 p-4">
            {/* Left Side: Legend (hidden on mobile, shown on desktop as sidebar) */}
            <div className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-4">
                <MapLegend />
              </div>
            </div>

            {/* Center: Map - Shows first on mobile, middle on desktop */}
            <div className="w-full lg:flex-1 h-[400px] md:h-[500px] lg:h-[600px]">
              <SitesMap
                sites={sites}
                className="h-full w-full"
                onSiteSelect={(site) => setSelectedSiteId(site?.id || null)}
                selectedSite={selectedSite}
              />
            </div>

            {/* Right Side: Detail Panel (tablet and desktop only, hidden on mobile) */}
            {selectedSite && (
              <div className="hidden md:block md:w-full lg:w-96 xl:w-[28rem] flex-shrink-0">
                <div className="lg:sticky lg:top-4 h-[500px] lg:h-[600px]">
                  <SiteDetailPanel
                    site={selectedSite}
                    equipment={selectedSiteEquipment || undefined}
                    onClose={() => setSelectedSiteId(null)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mobile Legend (shown below map on small screens) */}
          <div className="lg:hidden p-4 border-t border-gray-200">
            <MapLegend />
          </div>
        </div>

        {/* Site Comparison Cards */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Site Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <SiteComparisonCard key={site.id} site={site} />
            ))}
          </div>
        </div>

        {/* Energy Flow & Efficiency Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site-Wise Energy Flow - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="text-orange-500" size={24} />
              Real-Time Energy Flow
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({sites.length} Sites)
              </span>
            </h2>
            <div className="h-[400px]">
              <SiteWiseEnergyFlow sites={sites} />
            </div>
          </div>

          {/* Efficiency Metrics - Takes 1 column */}
          <div className="space-y-4">
            {/* Autarchy */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${METRIC_COLORS.efficiency.high}20` }}
                >
                  <Leaf className="h-5 w-5" style={{ color: METRIC_COLORS.efficiency.high }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Autarchy</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(autarchy, 1)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${autarchy}%`,
                      backgroundColor: METRIC_COLORS.efficiency.high
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">Energy independence from grid</p>
              </div>
            </div>

            {/* Self Consumption */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${METRIC_COLORS.solar.primary}20` }}
                >
                  <TrendingUp className="h-5 w-5" style={{ color: METRIC_COLORS.solar.primary }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Self Consumption</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(selfConsumption, 1)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selfConsumption}%`,
                      backgroundColor: METRIC_COLORS.solar.primary
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">Solar energy used locally</p>
              </div>
            </div>

            {/* Storage Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${getStorageColor(batteryPower)}20` }}
                >
                  <Battery className="h-5 w-5" style={{ color: getStorageColor(batteryPower) }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Storage System</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(batterySoc, 0)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${batterySoc}%`,
                      backgroundColor: getStorageColor(batteryPower)
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {getStorageStatusText(batteryPower)} • {telemetry ? Math.round(telemetry.batteryTemperature) : '--'}°C
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Consumption Breakdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consumption Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">HVAC</p>
              <p className="text-xl font-bold text-gray-900">{formatPower(consumptionBreakdown.hvac, 1)}</p>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${consumptionPower > 0 ? (consumptionBreakdown.hvac / consumptionPower) * 100 : 0}%`,
                    backgroundColor: '#3b82f6'
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Lighting</p>
              <p className="text-xl font-bold text-gray-900">{formatPower(consumptionBreakdown.lighting, 1)}</p>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${consumptionPower > 0 ? (consumptionBreakdown.lighting / consumptionPower) * 100 : 0}%`,
                    backgroundColor: '#f59e0b'
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Equipment</p>
              <p className="text-xl font-bold text-gray-900">{formatPower(consumptionBreakdown.equipment, 1)}</p>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${consumptionPower > 0 ? (consumptionBreakdown.equipment / consumptionPower) * 100 : 0}%`,
                    backgroundColor: '#10b981'
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Other</p>
              <p className="text-xl font-bold text-gray-900">{formatPower(consumptionBreakdown.other, 1)}</p>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${consumptionPower > 0 ? (consumptionBreakdown.other / consumptionPower) * 100 : 0}%`,
                    backgroundColor: '#8b5cf6'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Alerts & Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Panel */}
          <div className="h-[500px]">
            <AlertsPanel
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
            />
          </div>

          {/* Weather Widget */}
          <div className="h-[500px]">
            {weather && <WeatherWidget weather={weather} />}
            {!weather && (
              <div className="h-full bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center justify-center">
                <p className="text-gray-500">Loading weather data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Energy Analytics & Tariff Analysis */}
        {analytics && tariff && (
          <div className="space-y-6">
            <EnergyAnalyticsPanel analytics={analytics} />
            <TariffAnalysisPanel tariff={tariff} />
          </div>
        )}
      </main>

      <DashboardFooter />
    </>
  );
}