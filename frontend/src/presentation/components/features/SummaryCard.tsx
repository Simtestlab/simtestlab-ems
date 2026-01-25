'use client';

import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  decimals?: number;
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
    iconBg: 'bg-green-100',
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    iconBg: 'bg-orange-100',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-700',
    iconBg: 'bg-red-100',
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    iconBg: 'bg-cyan-100',
  },
};

export default function SummaryCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  decimals = 1,
}: SummaryCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = colorConfig[color];

  // Animated counter effect
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Gradient accent bar */}
      <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {displayValue.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
          </span>
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}
