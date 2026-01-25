import useSWR from 'swr';
import { Weather } from '@/domain/entities/weather.entity';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useWeather(refreshInterval: number = 60000) {
  const { data, error, isLoading } = useSWR<Weather>(
    '/api/ems/weather',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: refreshInterval,
    }
  );

  return {
    weather: data || null,
    isLoading,
    isError: error,
  };
}
