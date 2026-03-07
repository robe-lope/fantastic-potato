import { NextRequest, NextResponse } from 'next/server';

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

interface YFMeta {
  regularMarketPrice?: number;
  currency?: string;
  marketState?: string;
  shortName?: string;
  longName?: string;
  symbol?: string;
}

async function fetchYahooQuote(yahooSymbol: string): Promise<{
  price: number | null;
  currency: string;
  marketState: string;
  name: string;
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: YF_HEADERS });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json() as { chart?: { result?: Array<{ meta?: YFMeta }>; error?: unknown } };
  const meta = data?.chart?.result?.[0]?.meta;

  if (!meta) {
    throw new Error('Sin datos del símbolo');
  }

  return {
    price: meta.regularMarketPrice ?? null,
    currency: meta.currency ?? 'ARS',
    marketState: meta.marketState ?? 'UNKNOWN',
    name: meta.shortName ?? meta.longName ?? yahooSymbol,
  };
}

export async function POST(request: NextRequest) {
  const { tickers } = await request.json() as { tickers?: Array<{ symbol: string; yahooSymbol: string }> };

  if (!tickers || !Array.isArray(tickers)) {
    return NextResponse.json({ error: 'Se requiere un array de tickers' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    tickers.map(async ({ symbol, yahooSymbol }) => {
      try {
        const quote = await fetchYahooQuote(yahooSymbol);
        return { ticker: symbol, yahooSymbol, ...quote, error: null };
      } catch (err) {
        return {
          ticker: symbol,
          yahooSymbol,
          price: null as null,
          currency: 'ARS',
          marketState: 'UNKNOWN',
          name: symbol,
          error: String(err),
        };
      }
    }),
  );

  const prices = results.map(r => r.status === 'fulfilled' ? r.value : {
    ticker: '',
    yahooSymbol: '',
    price: null,
    currency: 'ARS',
    marketState: 'UNKNOWN',
    name: '',
    error: 'Error desconocido',
  });

  return NextResponse.json({ prices, fetchedAt: new Date().toISOString() });
}
