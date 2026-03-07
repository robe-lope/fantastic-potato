export interface Transaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  ticker: string;
  assetType: 'CEDEAR' | 'ACCION_LOCAL';
  quantity: number;
  pricePerUnit: number;
  currency: 'ARS' | 'USD';
  totalAmount: number;
  exchangeRate?: number;
  notes?: string;
}

export interface CurrentPrice {
  ticker: string;
  price: number;
  currency: 'ARS' | 'USD';
  updatedAt: string; // YYYY-MM-DD
}

export interface Holding {
  ticker: string;
  assetType: 'CEDEAR' | 'ACCION_LOCAL';
  totalQuantity: number;
  averageCostARS: number;
  averageCostUSD: number;
  totalInvestedARS: number;
  totalInvestedUSD: number;
  currentPricePerUnit?: number;
  currentPriceCurrency?: 'ARS' | 'USD';
  currentTotalValue?: number;
  unrealizedGainLoss?: number;
  unrealizedGainLossPct?: number;
  // Valores en ambas monedas (disponibles cuando hay precio actual + tipo de cambio CCL)
  currentTotalValueARS?: number;
  currentTotalValueUSD?: number;
  unrealizedGainLossARS?: number;
  unrealizedGainLossUSD?: number;
  unrealizedGainLossPctARS?: number;
  unrealizedGainLossPctUSD?: number;
  transactions: Transaction[];
}

export interface PortfolioSummary {
  totalInvestedARS: number;
  totalInvestedUSD: number;
  totalAssets: number;
  totalTransactions: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
  currentTotalValueARS: number;
  unrealizedGainLossARS: number;
  unrealizedGainLossPctARS: number;
  assetsWithPrice: number;
  currentTotalValueUSD: number;
  unrealizedGainLossUSD: number;
  unrealizedGainLossPctUSD: number;
  assetsWithPriceUSD: number;
}

export type SortField =
  | 'ticker'
  | 'assetType'
  | 'totalQuantity'
  | 'averageCostARS'
  | 'totalInvestedARS'
  | 'totalInvestedUSD'
  | 'percentage'
  | 'currentTotalValue'
  | 'unrealizedGainLoss'
  | 'unrealizedGainLossPct';

export type SortDirection = 'asc' | 'desc';
