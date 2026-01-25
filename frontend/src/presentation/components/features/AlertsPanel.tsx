'use client';

import { Alert, AlertSeverity } from '@/domain/entities/alert.entity';
import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { formatTimestamp } from '@/shared/utils/formatting';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

const severityConfig = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
    badge: 'bg-red-600',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    textColor: 'text-orange-900',
    badge: 'bg-orange-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
    badge: 'bg-blue-600',
  },
};

const categoryLabels = {
  battery: 'Battery',
  grid: 'Grid',
  solar: 'Solar',
  consumption: 'Load',
  system: 'System',
};

export default function AlertsPanel({ alerts, onAcknowledge }: AlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={24} />
          Alerts & Notifications
        </h2>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 text-xs font-bold text-white bg-orange-600 rounded">
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Check size={48} className="mb-2" />
            <p className="text-sm font-medium">All Clear</p>
            <p className="text-xs">No active alerts</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={`${config.bg} ${config.border} border rounded-lg p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm ${config.textColor}`}>
                        {alert.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium text-white ${config.badge} rounded flex-shrink-0`}>
                        {categoryLabels[alert.category]}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(alert.timestamp, 'time')}
                      </span>
                      
                      {onAcknowledge && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                        >
                          <X size={14} />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {activeAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">Last updated: {formatTimestamp(new Date(), 'time')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
