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

export interface Holding {
  ticker: string;
  assetType: 'CEDEAR' | 'ACCION_LOCAL';
  totalQuantity: number;
  averageCostARS: number;
  averageCostUSD: number;
  totalInvestedARS: number;
  totalInvestedUSD: number;
  transactions: Transaction[];
}

export interface PortfolioSummary {
  totalInvestedARS: number;
  totalInvestedUSD: number;
  totalAssets: number;
  totalTransactions: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
}

export type SortField = 'ticker' | 'assetType' | 'totalQuantity' | 'averageCostARS' | 'totalInvestedARS' | 'totalInvestedUSD' | 'percentage';
export type SortDirection = 'asc' | 'desc';

export type Page = 'dashboard' | 'nueva-operacion' | 'operaciones' | 'graficos' | 'configuracion';
