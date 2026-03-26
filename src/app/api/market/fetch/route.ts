import { NextResponse } from 'next/server';

const BRAPI_TOKEN = 'fLJbEd8uzbDUm1hoSAXrXk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`);
    if (!response.ok) {
      console.error(`Error fetching ${ticker}: ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch ticker data' }, { status: response.status });
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return NextResponse.json(data.results[0], { status: 200 });
    }
    return NextResponse.json({ error: 'No data found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
