import useSWR from 'swr';
import { EnergyAnalytics } from '@/domain/entities/analytics.entity';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useAnalytics(refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR<EnergyAnalytics>(
    '/api/ems/analytics',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: refreshInterval,
    }
  );

  return {
    analytics: data || null,
    isLoading,
    isError: error,
  };
}
