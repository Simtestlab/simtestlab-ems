import useSWR from 'swr';

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

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

interface AlertsData {
  timestamp: Date;
  alerts: Alert[];
  stats: AlertStats;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useAlerts(refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR<AlertsData>(
    '/api/ems/alerts',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: refreshInterval,
    }
  );

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/ems/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertId, action: 'acknowledge' }),
      });

      if (response.ok) {
        // Re-fetch alerts after acknowledging
        mutate();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  return {
    alerts: data?.alerts || [],
    stats: data?.stats || { total: 0, critical: 0, warning: 0, info: 0 },
    isLoading,
    isError: error,
    acknowledgeAlert,
  };
}
