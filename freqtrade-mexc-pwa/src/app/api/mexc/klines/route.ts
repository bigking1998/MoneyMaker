import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '100';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LumaTrade/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`MEXC API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Transform MEXC kline data to our format
    const transformedData = data.map((kline: any[]) => ({
      time: parseInt(kline[0]) / 1000, // Convert ms to seconds for lightweight-charts
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]), 
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
    
    return NextResponse.json(transformedData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching MEXC klines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kline data' },
      { status: 500 }
    );
  }
}