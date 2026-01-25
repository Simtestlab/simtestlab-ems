export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'battery' | 'grid' | 'solar' | 'consumption' | 'system';

export interface Alert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  acknowledged: boolean;
  siteId?: string;
}

export interface AlertStats {
  critical: number;
  warning: number;
  info: number;
  total: number;
}
