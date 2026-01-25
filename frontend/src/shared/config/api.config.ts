/**
 * API Configuration
 * 
 * Central configuration for API endpoints
 */

export const API_CONFIG = {
  // Django backend base URL
  DJANGO_API_BASE_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000',
  
  // API endpoints
  EMS: {
    LIVE: '/api/ems/live',
    KPIS: '/api/ems/kpis',
    CHARTS: '/api/ems/charts',
    ANALYTICS: '/api/ems/analytics',
    ALERTS: '/api/ems/alerts',
    TARIFF: '/api/ems/tariff',
    WEATHER: '/api/ems/weather',
    SITES: '/api/ems/sites',
    SITE_CHARTS: (siteId: string) => `/api/ems/sites/${siteId}/charts`,
  },
} as const;

/**
 * Get full API URL
 * For client-side fetches that go directly to Django
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.DJANGO_API_BASE_URL}${endpoint}`;
}
