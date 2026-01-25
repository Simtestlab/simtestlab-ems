'use client';

import { Space } from '@/domain/entities/space.entity';
import { formatPower } from '@/shared/utils/formatting';
import { MapPin, Zap, Battery } from 'lucide-react';

interface SiteComparisonCardProps {
  site: Space;
}

export default function SiteComparisonCard({ site }: SiteComparisonCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{site.name}</h3>
            <p className="text-xs text-gray-500">{site.location?.city}, {site.location?.state}</p>
          </div>
        </div>
        <div className={`h-2 w-2 rounded-full ${getStatusColor(site.metrics?.status || 'offline')}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Zap className="h-3.5 w-3.5" />
            <span>Power</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {formatPower(site.metrics?.currentPower || 0, 1)}
          </span>
        </div>

        {site.metrics?.soc !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Battery className="h-3.5 w-3.5" />
              <span>SOC</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{site.metrics.soc}%</span>
          </div>
        )}

        {site.metrics?.efficiency !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Efficiency</span>
              <span className="font-medium text-gray-900">{site.metrics.efficiency}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${site.metrics.efficiency}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
