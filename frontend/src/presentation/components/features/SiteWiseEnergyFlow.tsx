/**
 * Site-wise Energy Flow Component
 * Shows individual site contributions to total energy flow
 */

'use client';

import { Space } from '@/domain/entities/space.entity';
import { formatPower } from '@/shared/utils/formatting';
import { MapPin, Zap, Sun, Battery, TrendingUp, TrendingDown } from 'lucide-react';

interface SiteWiseEnergyFlowProps {
  sites: Space[];
}

export default function SiteWiseEnergyFlow({ sites }: SiteWiseEnergyFlowProps) {
  // Calculate totals
  const totals = sites.reduce((acc, site) => {
    if (!site.metrics) return acc;
    return {
      solar: acc.solar + (site.metrics.currentPower || 0),
      consumption: acc.consumption + (site.capacity.consumption || 0) * 0.7, // Estimated load
      soc: acc.soc + (site.metrics.soc || 0),
      sitesCount: acc.sitesCount + 1,
    };
  }, { solar: 0, consumption: 0, soc: 0, sitesCount: 0 });

  const avgSoc = totals.sitesCount > 0 ? totals.soc / totals.sitesCount : 0;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Total Solar</p>
          <p className="text-2xl font-bold text-orange-600">{formatPower(totals.solar, 1)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Total Load</p>
          <p className="text-2xl font-bold text-blue-600">{formatPower(totals.consumption, 1)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Avg Battery</p>
          <p className="text-2xl font-bold text-green-600">{avgSoc.toFixed(0)}%</p>
        </div>
      </div>

      {/* Individual Site Cards */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {sites.map((site) => {
          if (!site.metrics) return null;

          const solarPower = site.metrics.currentPower || 0;
          const soc = site.metrics.soc || 0;
          const efficiency = site.metrics.efficiency || 0;
          const status = site.metrics.status || 'offline';
          const capacity = site.capacity.solar || 0;
          const utilization = capacity > 0 ? (solarPower / capacity) * 100 : 0;

          // Status colors
          const statusColor = 
            status === 'online' ? 'green' :
            status === 'warning' ? 'amber' :
            status === 'error' ? 'red' : 'gray';

          return (
            <div
              key={site.id}
              className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              {/* Site Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 text-${statusColor}-600`} />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{site.name}</h4>
                    <p className="text-xs text-gray-600">
                      {site.location?.city}, {site.location?.state}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full bg-${statusColor}-100 border border-${statusColor}-200`}>
                  <span className={`text-xs font-medium text-${statusColor}-700 uppercase`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Energy Metrics Grid */}
              <div className="grid grid-cols-4 gap-3">
                {/* Solar Generation */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Sun className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">Solar</p>
                  <p className="text-sm font-bold text-orange-600">
                    {formatPower(solarPower, 1)}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {utilization.toFixed(0)}% util
                  </p>
                </div>

                {/* Battery SOC */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Battery className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">Battery</p>
                  <p className="text-sm font-bold text-green-600">
                    {soc.toFixed(0)}%
                  </p>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        soc > 70 ? 'bg-green-500' :
                        soc > 30 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${soc}%` }}
                    />
                  </div>
                </div>

                {/* Efficiency */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Zap className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">Efficiency</p>
                  <p className="text-sm font-bold text-purple-600">
                    {efficiency.toFixed(0)}%
                  </p>
                  <div className="flex items-center justify-center mt-0.5">
                    {efficiency > 90 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="h-4 w-4 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-blue-600">kW</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">Capacity</p>
                  <p className="text-sm font-bold text-blue-600">
                    {capacity.toFixed(0)} kW
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {site.capacity.storage?.toFixed(0) || 0} kWh
                  </p>
                </div>
              </div>

              {/* Energy Flow Indicator */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-gray-600">Generating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-400 via-green-400 to-blue-400 rounded-full min-w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Load</span>
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
