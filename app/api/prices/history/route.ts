import { NextRequest, NextResponse } from 'next/server';

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

interface YFChartResult {
  meta?: { currency?: string };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: (number | null)[] }>;
  };
}

export async function POST(request: NextRequest) {
  const { symbols, period = '1y' } = await request.json() as { symbols?: string[]; period?: string };

  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return NextResponse.json({ error: 'Se requiere array de symbols' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    symbols.map(async (symbol: string) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=${period}`;
      const res = await fetch(url, { headers: YF_HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { chart?: { result?: YFChartResult[] } };
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('Sin datos');

      const timestamps = result.timestamp ?? [];
      const closes = result.indicators?.quote?.[0]?.close ?? [];

      const series = timestamps
        .map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          price: closes[i] ?? null,
        }))
        .filter((d): d is { date: string; price: number } => d.price !== null && d.price > 0);

      return { symbol, series };
    }),
  );

  const history: Record<string, { date: string; price: number }[]> = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      history[r.value.symbol] = r.value.series;
    }
  }

  return NextResponse.json({ history });
}
