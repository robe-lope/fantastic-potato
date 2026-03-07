'use client';

import { useMemo } from 'react';
import type { Transaction, CurrentPrice } from '@/types';
import { calculateHoldings, calculatePortfolioSummary, getPortfolioPercentage } from '@/lib/calculations';

export function usePortfolio(
  transactions: Transaction[],
  currentPrices: Record<string, CurrentPrice> = {},
  cclRate?: number,
) {
  const holdings = useMemo(
    () => calculateHoldings(transactions, currentPrices, cclRate),
    [transactions, currentPrices, cclRate],
  );

  const summary = useMemo(
    () => calculatePortfolioSummary(transactions, holdings),
    [transactions, holdings],
  );

  const holdingsWithPercentage = useMemo(
    () => holdings.map(h => ({
      ...h,
      percentage: getPortfolioPercentage(h, holdings),
    })),
    [holdings],
  );

  return { holdings: holdingsWithPercentage, summary };
}
