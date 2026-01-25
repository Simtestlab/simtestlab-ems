/**
 * Site Detail Panel Component
 * Displays comprehensive site information in a tabbed interface
 */

'use client';

import { useState } from 'react';
import { Space } from '@/domain/entities/space.entity';
import { Inverter, Meter, Battery } from '@/domain/entities/equipment.entity';
import { formatPower, formatPercentage } from '@/shared/utils/formatting';
import { useRealtimeSiteChartData } from '@/presentation/hooks/useRealtimeSiteChartData.api';
import SparklineChart from '@/presentation/components/ui/SparklineChart';
import { 
  X, 
  Zap, 
  Battery as BatteryIcon, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Calendar,
  Thermometer,
  Gauge
} from 'lucide-react';

interface SiteDetailPanelProps {
  site: Space;
  equipment?: {
    inverters: Inverter[];
    meters: Meter[];
    batteries: Battery[];
  };
  onClose: () => void;
  className?: string;
}

export default function SiteDetailPanel({ 
  site, 
  equipment,
  onClose, 
  className = '' 
}: SiteDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'performance'>('overview');
  
  // Track real-time chart data for the selected site
  const chartData = useRealtimeSiteChartData(site);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'equipment', label: 'Equipment', icon: Activity },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ] as const;

  // Calculate equipment summary
  const equipmentSummary = equipment ? {
    invertersOnline: equipment.inverters.filter(i => i.status === 'online').length,
    invertersTotal: equipment.inverters.length,
    invertersPower: equipment.inverters.reduce((sum, i) => sum + i.activePower, 0),
    batteriesOnline: equipment.batteries.filter(b => b.status === 'online').length,
    batteriesTotal: equipment.batteries.length,
    batteriesSoc: equipment.batteries.length > 0 
      ? equipment.batteries.reduce((sum, b) => sum + b.soc, 0) / equipment.batteries.length 
      : 0,
    metersOnline: equipment.meters.filter(m => m.status === 'online').length,
    metersTotal: equipment.meters.length,
    totalAlarms: [
      ...equipment.inverters.flatMap(i => i.alarms),
      ...equipment.batteries.flatMap(b => b.alarms),
    ].length,
  } : null;

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{site.name}</h2>
          <p className="text-sm text-gray-600">
            {site.location?.city}, {site.location?.state}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              site.metrics?.status === 'online' ? 'bg-green-500' : 
              site.metrics?.status === 'warning' ? 'bg-amber-500' : 
              'bg-red-500'
            } animate-pulse`} />
            <span className="text-sm font-medium text-gray-900 uppercase">
              {site.metrics?.status || 'Unknown'}
            </span>
          </div>
          {equipmentSummary && equipmentSummary.totalAlarms > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{equipmentSummary.totalAlarms} Alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 overflow-y-auto flex-1">
        {activeTab === 'overview' && (
          <OverviewTab site={site} equipmentSummary={equipmentSummary} chartData={chartData} />
        )}
        {activeTab === 'equipment' && equipment && (
          <EquipmentTab equipment={equipment} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab site={site} chartData={chartData} />
        )}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ 
  site, 
  equipmentSummary,
  chartData 
}: { 
  site: Space; 
  equipmentSummary: any;
  chartData: ReturnType<typeof useRealtimeSiteChartData>;
}) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <span className="text-green-600">↑</span>;
    if (trend === 'down') return <span className="text-red-600">↓</span>;
    return <span className="text-gray-400">→</span>;
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-600 font-medium">Current Power</p>
            {chartData?.trends.power && getTrendIcon(chartData.trends.power)}
          </div>
          <p className="text-xl font-bold text-blue-900">
            {formatPower(site.metrics?.currentPower || 0, 1)}
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-600 font-medium">Battery SOC</p>
            {chartData?.trends.soc && getTrendIcon(chartData.trends.soc)}
          </div>
          <p className="text-xl font-bold text-green-900">
            {site.metrics?.soc || 0}%
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-600 font-medium">Efficiency</p>
            {chartData?.trends.efficiency && getTrendIcon(chartData.trends.efficiency)}
          </div>
          <p className="text-xl font-bold text-purple-900">
            {site.metrics?.efficiency || 0}%
          </p>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
          <p className="text-xs text-orange-600 font-medium">Capacity</p>
          <p className="text-xl font-bold text-orange-900">
            {site.capacity?.solar || 0} kW
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Location</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>{site.location?.address}</p>
          <p>{site.location?.city}, {site.location?.state} {site.location?.country}</p>
        </div>
      </div>

      {/* Equipment Summary */}
      {equipmentSummary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Equipment Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">Inverters</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {equipmentSummary.invertersOnline}/{equipmentSummary.invertersTotal}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <BatteryIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Batteries</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {equipmentSummary.batteriesOnline}/{equipmentSummary.batteriesTotal} 
                {equipmentSummary.batteriesTotal > 0 && (
                  <span className="text-xs text-gray-600 ml-2">
                    ({equipmentSummary.batteriesSoc.toFixed(0)}% SOC)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">Meters</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {equipmentSummary.metersOnline}/{equipmentSummary.metersTotal}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Info */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Installed Capacity</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Solar:</span>
            <span className="font-medium text-gray-900">{site.capacity?.solar || 0} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Storage:</span>
            <span className="font-medium text-gray-900">{site.capacity?.storage || 0} kWh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consumption:</span>
            <span className="font-medium text-gray-900">{site.capacity?.consumption || 0} kW</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Equipment Tab
function EquipmentTab({ equipment }: { equipment: { inverters: Inverter[]; meters: Meter[]; batteries: Battery[] } }) {
  const [selectedType, setSelectedType] = useState<'inverters' | 'meters' | 'batteries'>('inverters');

  return (
    <div className="space-y-4">
      {/* Equipment Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('inverters')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedType === 'inverters'
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Zap className="w-4 h-4" />
            Inverters ({equipment.inverters.length})
          </div>
        </button>
        <button
          onClick={() => setSelectedType('batteries')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedType === 'batteries'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <BatteryIcon className="w-4 h-4" />
            Batteries ({equipment.batteries.length})
          </div>
        </button>
        <button
          onClick={() => setSelectedType('meters')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedType === 'meters'
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Activity className="w-4 h-4" />
            Meters ({equipment.meters.length})
          </div>
        </button>
      </div>

      {/* Equipment List */}
      <div className="space-y-2">
        {selectedType === 'inverters' && equipment.inverters.map((inverter) => (
          <InverterCard key={inverter.id} inverter={inverter} />
        ))}
        {selectedType === 'batteries' && equipment.batteries.map((battery) => (
          <BatteryCard key={battery.id} battery={battery} />
        ))}
        {selectedType === 'meters' && equipment.meters.map((meter) => (
          <MeterCard key={meter.id} meter={meter} />
        ))}
      </div>
    </div>
  );
}

// Inverter Card
function InverterCard({ inverter }: { inverter: Inverter }) {
  const statusColor = inverter.status === 'online' ? 'green' : inverter.status === 'warning' ? 'amber' : 'red';
  
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 text-${statusColor}-500`} />
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{inverter.name}</h4>
            <p className="text-xs text-gray-600">{inverter.model}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded bg-${statusColor}-100 text-${statusColor}-700`}>
          {inverter.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-600">Power</p>
          <p className="font-medium text-gray-900">{formatPower(inverter.activePower, 1)}</p>
        </div>
        <div>
          <p className="text-gray-600">Efficiency</p>
          <p className="font-medium text-gray-900">{inverter.efficiency.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-600">Temp</p>
          <p className="font-medium text-gray-900">{inverter.temperature}°C</p>
        </div>
      </div>
      {inverter.alarms.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">{inverter.alarms[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Battery Card
function BatteryCard({ battery }: { battery: Battery }) {
  const statusColor = battery.status === 'online' ? 'green' : battery.status === 'warning' ? 'amber' : 'red';
  const isCharging = battery.activePower > 0;
  
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <BatteryIcon className={`w-4 h-4 text-${statusColor}-500`} />
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{battery.name}</h4>
            <p className="text-xs text-gray-600">{battery.model}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded bg-${statusColor}-100 text-${statusColor}-700`}>
          {battery.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div>
          <p className="text-gray-600">SOC</p>
          <p className="font-medium text-gray-900">{battery.soc}%</p>
        </div>
        <div>
          <p className="text-gray-600">SOH</p>
          <p className="font-medium text-gray-900">{battery.soh}%</p>
        </div>
        <div>
          <p className="text-gray-600">Power</p>
          <p className="font-medium text-gray-900">
            {isCharging ? '+' : ''}{formatPower(Math.abs(battery.activePower), 1)}
          </p>
        </div>
      </div>
      {/* SOC Progress Bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all bg-${statusColor}-500`}
          style={{ width: `${battery.soc}%` }}
        />
      </div>
      {battery.alarms.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">{battery.alarms[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Meter Card
function MeterCard({ meter }: { meter: Meter }) {
  const statusColor = meter.status === 'online' ? 'green' : 'red';
  const typeLabel = meter.type.charAt(0).toUpperCase() + meter.type.slice(1);
  
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 text-${statusColor}-500`} />
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{meter.name}</h4>
            <p className="text-xs text-gray-600">{typeLabel} • {meter.model}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded bg-${statusColor}-100 text-${statusColor}-700`}>
          {meter.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-600">Power</p>
          <p className="font-medium text-gray-900">{formatPower(meter.activePower, 1)}</p>
        </div>
        <div>
          <p className="text-gray-600">Voltage</p>
          <p className="font-medium text-gray-900">{meter.voltageAvg?.toFixed(0) || '-'} V</p>
        </div>
        <div>
          <p className="text-gray-600">Frequency</p>
          <p className="font-medium text-gray-900">{meter.frequency?.toFixed(2) || '-'} Hz</p>
        </div>
      </div>
    </div>
  );
}

// Performance Tab
function PerformanceTab({ site, chartData }: { site: Space; chartData: ReturnType<typeof useRealtimeSiteChartData> }) {
  if (!chartData || chartData.dataPoints.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Collecting performance data...</p>
          <p className="text-xs text-gray-400 mt-1">Charts will appear after a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Section Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Real-time Trends</h3>
        <p className="text-xs text-gray-600">Last {Math.floor(chartData.dataPoints.length * 2 / 60)} minutes</p>
      </div>

      {/* Power Trend Chart */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
        <SparklineChart
          data={chartData.dataPoints}
          dataKey="power"
          height={80}
          width={300}
          color="#3b82f6"
          showGradient={true}
          label="Power Output"
          unit=" kW"
          className="w-full"
        />
      </div>

      {/* SOC Trend Chart */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200">
        <SparklineChart
          data={chartData.dataPoints}
          dataKey="soc"
          height={80}
          width={300}
          color="#10b981"
          showGradient={true}
          label="Battery State of Charge"
          unit="%"
          className="w-full"
        />
      </div>

      {/* Efficiency Trend Chart */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
        <SparklineChart
          data={chartData.dataPoints}
          dataKey="efficiency"
          height={80}
          width={300}
          color="#8b5cf6"
          showGradient={true}
          label="System Efficiency"
          unit="%"
          className="w-full"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Avg Power</p>
          <p className="text-lg font-bold text-blue-900">
            {(chartData.dataPoints.reduce((sum: number, d) => sum + d.power, 0) / chartData.dataPoints.length).toFixed(1)} kW
          </p>
          <p className="text-xs text-blue-600 mt-1">Current period</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Avg Efficiency</p>
          <p className="text-lg font-bold text-green-900">
            {(chartData.dataPoints.reduce((sum: number, d) => sum + d.efficiency, 0) / chartData.dataPoints.length).toFixed(1)}%
          </p>
          <p className="text-xs text-green-600 mt-1">Current period</p>
        </div>
      </div>
    </div>
  );
}
