/**
 * EMS Charts API - Proxy to Django Backend
 * 
 * Proxies requests to Django backend
 * Route: GET /api/ems/charts
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

export interface ChartDataPoint {
  timestamp: string;
  value: number;
}

export interface ChartsResponse {
  /** Grid power time series */
  grid: ChartDataPoint[];
  /** Solar power time series */
  solar: ChartDataPoint[];
  /** Load power time series */
  load: ChartDataPoint[];
  /** Battery power time series */
  battery: ChartDataPoint[];
  /** ISO timestamp of this reading */
  timestamp: string;
}

export async function GET() {
  try {
    const response = await fetch(`${DJANGO_API_URL}/api/ems/charts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Django API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('[Proxy /api/ems/charts] Error:', error);
    
    const isConnectionError = error.code === 'ECONNREFUSED' || 
                               error.cause?.code === 'ECONNREFUSED';
    
    return NextResponse.json(
      { 
        error: isConnectionError 
          ? 'Backend server is not running. Please start Django server: python3 manage.py runserver'
          : 'Failed to fetch chart data',
        backendUrl: DJANGO_API_URL,
        isConnectionError,
      },
      { status: 503 }
    );
  }
}
