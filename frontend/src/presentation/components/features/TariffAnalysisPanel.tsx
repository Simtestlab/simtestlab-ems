'use client';

import { TariffAnalysis } from '@/domain/entities/analytics.entity';
import { DollarSign, TrendingDown, Clock, Receipt, PiggyBank, Zap } from 'lucide-react';

interface TariffAnalysisPanelProps {
  tariff: TariffAnalysis;
}

export default function TariffAnalysisPanel({ tariff }: TariffAnalysisPanelProps) {
  const costBreakdownData = [
    { label: 'Solar Savings', value: tariff.costBreakdown.solar, color: 'bg-green-500', textColor: 'text-green-900' },
    { label: 'Grid Cost', value: tariff.costBreakdown.grid, color: 'bg-red-500', textColor: 'text-red-900' },
    { label: 'Battery Savings', value: tariff.costBreakdown.battery, color: 'bg-blue-500', textColor: 'text-blue-900' },
  ];

  const totalBreakdown = costBreakdownData.reduce((sum, item) => sum + item.value, 0);

  const tariffTypeColors = {
    'peak': 'bg-red-100 text-red-800 border-red-300',
    'mid-peak': 'bg-orange-100 text-orange-800 border-orange-300',
    'off-peak': 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="text-green-600" size={24} />
          Tariff & Billing Analysis
        </h2>
        <div className={`px-3 py-1.5 rounded-lg border ${tariffTypeColors[tariff.currentRate.type]}`}>
          <span className="text-sm font-semibold">{tariff.currentRate.name} - ₹{tariff.currentRate.rate}/kWh</span>
        </div>
      </div>

      {/* Top Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Savings vs Grid</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mb-1">
            ₹{Math.round(tariff.savingsVsGrid).toLocaleString()}
          </p>
          <p className="text-xs text-green-700">
            {tariff.savingsPercentage.toFixed(1)}% reduction
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Month-to-Date</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mb-1">
            ₹{Math.round(tariff.monthToDateCost).toLocaleString()}
          </p>
          <p className="text-xs text-blue-700">
            Current spending
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Projected Bill</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mb-1">
            ₹{Math.round(tariff.billing.projectedMonthly).toLocaleString()}
          </p>
          <p className="text-xs text-purple-700">
            This month
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Demand Charge</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mb-1">
            ₹{Math.round(tariff.demandCharge).toLocaleString()}
          </p>
          <p className="text-xs text-orange-700">
            Peak demand cost
          </p>
        </div>
      </div>

      {/* Billing Breakdown & Cost Breakdown Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-gray-600" />
            Billing Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Energy Charges</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{Math.round(tariff.billing.energyCharges).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Demand Charges</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{Math.round(tariff.billing.demandCharges).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Fixed Charges</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{Math.round(tariff.billing.fixedCharges).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Taxes (GST 18%)</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{Math.round(tariff.billing.taxes).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 bg-green-50 rounded px-3 border border-green-200">
              <span className="text-base font-bold text-green-900">Total Amount</span>
              <span className="text-xl font-bold text-green-900">
                ₹{Math.round(tariff.billing.total).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown by Source */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-gray-600" />
            Cost by Energy Source
          </h3>
          <div className="space-y-4">
            {costBreakdownData.map((item, index) => {
              const percentage = (item.value / totalBreakdown) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{Math.round(item.value).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total cost</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tariff Schedule */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          Today's Tariff Schedule
        </h3>
        <div className="flex flex-wrap gap-2">
          {tariff.tariffSchedule.map((rate, index) => (
            <div
              key={index}
              className={`px-3 py-2 rounded-lg border ${tariffTypeColors[rate.type]} text-xs font-medium`}
            >
              <div className="flex items-center gap-2">
                <span>{rate.startHour.toString().padStart(2, '0')}:00 - {rate.endHour.toString().padStart(2, '0')}:00</span>
                <span className="font-bold">₹{rate.rate}/kWh</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
