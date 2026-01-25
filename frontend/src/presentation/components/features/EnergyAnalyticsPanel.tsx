'use client';

import { EnergyAnalytics } from '@/domain/entities/analytics.entity';
import { TrendingUp, TrendingDown, Zap, Calendar, BarChart3 } from 'lucide-react';

interface EnergyAnalyticsProps {
  analytics: EnergyAnalytics;
}

export default function EnergyAnalyticsPanel({ analytics }: EnergyAnalyticsProps) {
  // Convert peakDemandTime to Date object if it's a string
  const peakDemandTime = typeof analytics.peakDemandTime === 'string' 
    ? new Date(analytics.peakDemandTime) 
    : analytics.peakDemandTime;

  const trends = [
    {
      label: 'Today vs Yesterday',
      current: analytics.todayConsumption,
      previous: analytics.yesterdayConsumption,
      change: analytics.trends.daily.change,
      isPositive: analytics.trends.daily.isPositive,
      unit: 'kWh',
    },
    {
      label: 'This Week vs Last Week',
      current: analytics.weekConsumption,
      previous: analytics.lastWeekConsumption,
      change: analytics.trends.weekly.change,
      isPositive: analytics.trends.weekly.isPositive,
      unit: 'kWh',
    },
    {
      label: 'This Month vs Last Month',
      current: analytics.monthConsumption,
      previous: analytics.lastMonthConsumption,
      change: analytics.trends.monthly.change,
      isPositive: analytics.trends.monthly.isPositive,
      unit: 'kWh',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          Energy Analytics
        </h2>
        <span className="text-sm text-gray-500">Historical Performance</span>
      </div>

      {/* Trend Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {trends.map((trend, index) => {
          const TrendIcon = trend.isPositive ? TrendingDown : TrendingUp;
          const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';
          const bgColor = trend.isPositive ? 'bg-green-50' : 'bg-red-50';

          return (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">{trend.label}</p>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(trend.current).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">{trend.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  vs {Math.round(trend.previous).toLocaleString()} {trend.unit}
                </span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
                  <TrendIcon className={trendColor} size={14} />
                  <span className={`text-xs font-semibold ${trendColor}`}>
                    {Math.abs(trend.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Peak Demand</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mb-1">
            {Math.round(analytics.peakDemand)} kW
          </p>
          <p className="text-xs text-blue-700">
            {peakDemandTime.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Load Factor</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mb-1">
            {(analytics.averageLoadFactor * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-purple-700">
            Average utilization
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Month-to-Date</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mb-1">
            {Math.round(analytics.monthConsumption * (new Date().getDate() / 30)).toLocaleString()}
          </p>
          <p className="text-xs text-green-700">
            kWh consumed
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={18} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Projected</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mb-1">
            {Math.round(analytics.monthConsumption).toLocaleString()}
          </p>
          <p className="text-xs text-orange-700">
            kWh this month
          </p>
        </div>
      </div>
    </div>
  );
}
