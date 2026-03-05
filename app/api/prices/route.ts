import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

export async function POST(request: NextRequest) {
  const { tickers } = await request.json();

  if (!tickers || !Array.isArray(tickers)) {
    return NextResponse.json({ error: 'Se requiere un array de tickers' }, { status: 400 });
  }

  const results = [];

  for (const { symbol, yahooSymbol } of tickers) {
    try {
      const quote = await yahooFinance.quote(yahooSymbol, {}, { validateResult: false });
      results.push({
        ticker: symbol,
        yahooSymbol,
        price: quote.regularMarketPrice ?? null,
        currency: quote.currency ?? 'ARS',
        marketState: quote.marketState ?? 'UNKNOWN',
        name: quote.shortName ?? quote.longName ?? symbol,
        error: null,
      });
    } catch {
      results.push({
        ticker: symbol,
        yahooSymbol,
        price: null,
        currency: 'ARS',
        marketState: 'UNKNOWN',
        name: symbol,
        error: `No se encontró ${yahooSymbol}`,
      });
    }
  }

  return NextResponse.json({ prices: results, fetchedAt: new Date().toISOString() });
}
