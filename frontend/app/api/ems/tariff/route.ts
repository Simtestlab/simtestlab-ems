/**
 * EMS Tariff API - Proxy to Django Backend
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${DJANGO_API_URL}/api/ems/tariff`, {
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
  } catch (error) {
    console.error('[Proxy /api/ems/tariff] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tariff' },
      { status: 500 }
    );
  }
}
