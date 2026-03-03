import { useMemo } from 'react';
import type { Transaction } from '../types';
import { calculateHoldings, calculatePortfolioSummary, getPortfolioPercentage } from '../utils/calculations';

export function usePortfolio(transactions: Transaction[]) {
  const holdings = useMemo(() => calculateHoldings(transactions), [transactions]);

  const summary = useMemo(() => calculatePortfolioSummary(transactions, holdings), [transactions, holdings]);

  const holdingsWithPercentage = useMemo(() =>
    holdings.map(h => ({
      ...h,
      percentage: getPortfolioPercentage(h, holdings),
    })),
    [holdings]
  );

  return { holdings: holdingsWithPercentage, summary };
}
