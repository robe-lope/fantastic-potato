import type { CurrentPrice } from '@/types';
import { toYahooTicker } from './yahooTickers';

export interface PriceResult {
  ticker: string;
  yahooSymbol: string;
  price: number | null;
  currency: string;
  marketState: string;
  name: string;
  error: string | null;
}

export interface FetchPricesResponse {
  prices: PriceResult[];
  fetchedAt: string;
}

export async function fetchCurrentPrices(
  holdings: Array<{
    ticker: string;
    assetType: 'CEDEAR' | 'ACCION_LOCAL';
    currentPriceCurrency?: 'ARS' | 'USD';
  }>,
): Promise<FetchPricesResponse> {
  const tickers = holdings.map(h => ({
    symbol: h.ticker,
    yahooSymbol: toYahooTicker(h.ticker, h.assetType, h.currentPriceCurrency ?? 'ARS'),
  }));

  const response = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response.json() as Promise<FetchPricesResponse>;
}

export function applyFetchedPrices(
  existing: Record<string, CurrentPrice>,
  results: PriceResult[],
  fetchedAt: string,
): Record<string, CurrentPrice> {
  const date = fetchedAt.slice(0, 10);
  const updated = { ...existing };

  for (const r of results) {
    if (r.price !== null && r.price > 0) {
      const currency: 'ARS' | 'USD' = r.currency === 'USD' ? 'USD' : 'ARS';
      updated[r.ticker] = {
        ticker: r.ticker,
        price: r.price,
        currency,
        updatedAt: date,
      };
    }
  }

  return updated;
}
