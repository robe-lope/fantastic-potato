import type { Transaction, Holding, PortfolioSummary } from '../types';

export function calculateHoldings(transactions: Transaction[]): Holding[] {
  const holdingsMap = new Map<string, {
    ticker: string;
    assetType: 'CEDEAR' | 'ACCION_LOCAL';
    totalQuantity: number;
    weightedSumARS: number;
    weightedSumUSD: number;
    totalBoughtQuantity: number;
    totalInvestedARS: number;
    totalInvestedUSD: number;
    transactions: Transaction[];
  }>();

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    const key = tx.ticker;
    if (!holdingsMap.has(key)) {
      holdingsMap.set(key, {
        ticker: tx.ticker,
        assetType: tx.assetType,
        totalQuantity: 0,
        weightedSumARS: 0,
        weightedSumUSD: 0,
        totalBoughtQuantity: 0,
        totalInvestedARS: 0,
        totalInvestedUSD: 0,
        transactions: [],
      });
    }

    const holding = holdingsMap.get(key)!;
    holding.transactions.push(tx);

    const priceARS = tx.currency === 'ARS'
      ? tx.pricePerUnit
      : tx.exchangeRate ? tx.pricePerUnit * tx.exchangeRate : undefined;

    const priceUSD = tx.currency === 'USD'
      ? tx.pricePerUnit
      : tx.exchangeRate ? tx.pricePerUnit / tx.exchangeRate : undefined;

    if (tx.type === 'BUY') {
      holding.totalQuantity += tx.quantity;
      holding.totalBoughtQuantity += tx.quantity;

      if (priceARS !== undefined) {
        holding.weightedSumARS += priceARS * tx.quantity;
        holding.totalInvestedARS += priceARS * tx.quantity;
      }
      if (priceUSD !== undefined) {
        holding.weightedSumUSD += priceUSD * tx.quantity;
        holding.totalInvestedUSD += priceUSD * tx.quantity;
      }
    } else if (tx.type === 'SELL') {
      holding.totalQuantity -= tx.quantity;
      // Ventas no afectan el PPP
    }
  }

  const holdings: Holding[] = [];
  for (const [, h] of holdingsMap) {
    if (h.totalQuantity > 0) {
      holdings.push({
        ticker: h.ticker,
        assetType: h.assetType,
        totalQuantity: h.totalQuantity,
        averageCostARS: h.totalBoughtQuantity > 0 ? h.weightedSumARS / h.totalBoughtQuantity : 0,
        averageCostUSD: h.totalBoughtQuantity > 0 ? h.weightedSumUSD / h.totalBoughtQuantity : 0,
        totalInvestedARS: h.totalInvestedARS,
        totalInvestedUSD: h.totalInvestedUSD,
        transactions: h.transactions,
      });
    }
  }

  return holdings;
}

export function calculatePortfolioSummary(transactions: Transaction[], holdings: Holding[]): PortfolioSummary {
  const buyTransactions = transactions.filter(t => t.type === 'BUY');
  const dates = transactions.map(t => t.date).sort();

  const totalInvestedARS = holdings.reduce((sum, h) => sum + h.totalInvestedARS, 0);
  const totalInvestedUSD = holdings.reduce((sum, h) => sum + h.totalInvestedUSD, 0);

  return {
    totalInvestedARS,
    totalInvestedUSD,
    totalAssets: holdings.length,
    totalTransactions: buyTransactions.length,
    firstTransactionDate: dates.length > 0 ? dates[0] : null,
    lastTransactionDate: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

export function getPortfolioPercentage(holding: Holding, holdings: Holding[]): number {
  const totalARS = holdings.reduce((sum, h) => sum + h.totalInvestedARS, 0);
  if (totalARS === 0) return 0;
  return (holding.totalInvestedARS / totalARS) * 100;
}

export function validateSell(ticker: string, quantity: number, transactions: Transaction[]): boolean {
  const holdings = calculateHoldings(transactions);
  const holding = holdings.find(h => h.ticker === ticker);
  if (!holding) return false;
  return holding.totalQuantity >= quantity;
}
