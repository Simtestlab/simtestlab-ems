import useSWR from 'swr';
import { TariffAnalysis } from '@/domain/entities/analytics.entity';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useTariff(refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR<TariffAnalysis>(
    '/api/ems/tariff',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: refreshInterval,
    }
  );

  return {
    tariff: data || null,
    isLoading,
    isError: error,
  };
}
