/**
 * Map Legend Component
 * Displays explanation of map markers, colors, and indicators
 */

'use client';

import { Battery, Zap, AlertTriangle, Activity } from 'lucide-react';

interface MapLegendProps {
  className?: string;
}

export default function MapLegend({ className = '' }: MapLegendProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-600 rounded"></span>
        Map Legend
      </h3>
      
      {/* Status Colors */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-600 uppercase">Status</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            <span className="text-xs text-gray-700">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
            <span className="text-xs text-gray-700">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            <span className="text-xs text-gray-700">Offline/Fault</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-sm" />
            <span className="text-xs text-gray-700">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Capacity Ring */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-600 uppercase">Capacity Ring</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <svg width="24" height="24" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                <circle cx="12" cy="12" r="9" fill="none" stroke="#10b981" strokeWidth="2" 
                  strokeDasharray="56.5" strokeDashoffset="14" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-3 h-3 text-green-600" />
              </div>
            </div>
            <span className="text-xs text-gray-700">Power utilization</span>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-600 uppercase">Indicators</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-4 bg-green-500 text-white text-[8px] font-bold rounded flex items-center justify-center border border-green-600">
              485
            </div>
            <span className="text-xs text-gray-700">Current power (kW)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              3
            </div>
            <span className="text-xs text-gray-700">Active alerts</span>
          </div>
        </div>
      </div>

      {/* Equipment Icons */}
      <div className="space-y-2 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-600 uppercase">Equipment</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-gray-700">Inverters</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-gray-700">Batteries</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-gray-700">Meters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
