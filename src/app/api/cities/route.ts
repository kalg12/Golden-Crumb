import { NextRequest, NextResponse } from 'next/server';

import citiesData from '@/data/cities.json';

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state')?.toUpperCase();

  if (!state || !/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json(
      { error: 'Invalid state parameter. Use a 2-letter US state code.' },
      { status: 400 },
    );
  }

  const cities = (citiesData as Record<string, { city: string; county: string; population: number; timezone?: string }[]>)[state];

  if (!cities || cities.length === 0) {
    return NextResponse.json(
      { error: `No cities found for state "${state}"` },
      { status: 404 },
    );
  }

  return NextResponse.json({ cities });
}
