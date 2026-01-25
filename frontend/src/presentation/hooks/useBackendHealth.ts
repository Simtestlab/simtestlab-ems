'use client';

import { useEffect, useState } from 'react';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

export function useBackendHealth(checkInterval: number = 5000) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${DJANGO_API_URL}/api/health`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (isMounted) {
          setIsHealthy(response.ok);
          setIsChecking(false);
        }
      } catch (error) {
        if (isMounted) {
          setIsHealthy(false);
          setIsChecking(false);
        }
      }
    };

    // Initial check
    checkHealth();

    // Set up interval for periodic checks (only if backend is down)
    const interval = setInterval(() => {
      if (!isHealthy) {
        checkHealth();
      }
    }, checkInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkInterval, isHealthy]);

  return { isHealthy, isChecking };
}
