'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, CurrentPrice } from '@/types';

// Sample data for seeding
const SAMPLE_TRANSACTIONS = [
  { date: '2023-03-15', type: 'BUY' as const, ticker: 'AAPL', assetType: 'CEDEAR' as const, quantity: 10, totalAmount: 45000, currency: 'ARS' as const, exchangeRate: 390, notes: 'Primera compra' },
  { date: '2023-05-20', type: 'BUY' as const, ticker: 'MELI', assetType: 'CEDEAR' as const, quantity: 5, totalAmount: 60000, currency: 'ARS' as const, exchangeRate: 450 },
  { date: '2023-07-10', type: 'BUY' as const, ticker: 'GGAL', assetType: 'ACCION_LOCAL' as const, quantity: 100, totalAmount: 180000, currency: 'ARS' as const },
  { date: '2023-09-01', type: 'BUY' as const, ticker: 'AAPL', assetType: 'CEDEAR' as const, quantity: 15, totalAmount: 78000, currency: 'ARS' as const, exchangeRate: 680 },
  { date: '2023-11-15', type: 'BUY' as const, ticker: 'GOOGL', assetType: 'CEDEAR' as const, quantity: 8, totalAmount: 280, currency: 'USD' as const },
  { date: '2024-01-20', type: 'BUY' as const, ticker: 'YPFD', assetType: 'ACCION_LOCAL' as const, quantity: 50, totalAmount: 425000, currency: 'ARS' as const },
  { date: '2024-03-10', type: 'BUY' as const, ticker: 'MELI', assetType: 'CEDEAR' as const, quantity: 3, totalAmount: 45000, currency: 'ARS' as const, exchangeRate: 850 },
  { date: '2024-05-15', type: 'SELL' as const, ticker: 'GGAL', assetType: 'ACCION_LOCAL' as const, quantity: 30, totalAmount: 96000, currency: 'ARS' as const },
  { date: '2024-07-01', type: 'BUY' as const, ticker: 'TSLA', assetType: 'CEDEAR' as const, quantity: 20, totalAmount: 136000, currency: 'ARS' as const, exchangeRate: 1200 },
  { date: '2024-09-20', type: 'BUY' as const, ticker: 'AAPL', assetType: 'CEDEAR' as const, quantity: 12, totalAmount: 504, currency: 'USD' as const },
];

const SAMPLE_PRICES = [
  { ticker: 'AAPL', price: 7200, currency: 'ARS' as const },
  { ticker: 'MELI', price: 18500, currency: 'ARS' as const },
  { ticker: 'GGAL', price: 5100, currency: 'ARS' as const },
  { ticker: 'GOOGL', price: 42, currency: 'USD' as const },
  { ticker: 'YPFD', price: 12000, currency: 'ARS' as const },
  { ticker: 'TSLA', price: 8500, currency: 'ARS' as const },
];

function mapTransaction(row: Record<string, unknown>): Transaction {
  const totalAmount = Number(row.total_amount);
  const quantity = Number(row.quantity);
  return {
    id: row.id as string,
    date: (row.date as string).slice(0, 10),
    type: row.type as 'BUY' | 'SELL',
    ticker: row.ticker as string,
    assetType: row.asset_type as 'CEDEAR' | 'ACCION_LOCAL',
    quantity,
    totalAmount,
    pricePerUnit: quantity > 0 ? totalAmount / quantity : Number(row.price_per_unit ?? 0),
    currency: row.currency as 'ARS' | 'USD',
    exchangeRate: row.exchange_rate ? Number(row.exchange_rate) : undefined,
    notes: (row.notes as string | null) ?? undefined,
  };
}

function mapPrice(row: Record<string, unknown>): CurrentPrice {
  return {
    ticker: row.ticker as string,
    price: Number(row.price),
    currency: row.currency as 'ARS' | 'USD',
    updatedAt: (row.updated_at as string).slice(0, 10),
  };
}

interface DataContextValue {
  transactions: Transaction[];
  currentPrices: Record<string, CurrentPrice>;
  isLoading: boolean;
  error: string | null;
  cclRate: number | null;
  refreshCCLRate: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'pricePerUnit'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updatePrice: (ticker: string, price: number, currency: 'ARS' | 'USD') => Promise<void>;
  updatePricesBulk: (prices: Record<string, CurrentPrice>) => Promise<void>;
  importTransactions: (txs: Transaction[], replace?: boolean) => Promise<void>;
  clearAllData: () => Promise<void>;
  loadSampleData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  transactions: [],
  currentPrices: {},
  isLoading: true,
  error: null,
  cclRate: null,
  refreshCCLRate: async () => {},
  addTransaction: async () => {},
  updateTransaction: async () => {},
  deleteTransaction: async () => {},
  updatePrice: async () => {},
  updatePricesBulk: async () => {},
  importTransactions: async () => {},
  clearAllData: async () => {},
  loadSampleData: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, CurrentPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cclRate, setCclRate] = useState<number | null>(null);

  const refreshCCLRate = useCallback(async () => {
    try {
      const res = await fetch('/api/dolar');
      if (res.ok) {
        const data = await res.json() as { rate?: number };
        if (data.rate) setCclRate(data.rate);
      }
    } catch {
      // ignorar errores de red — el CCL es opcional
    }
  }, []);

  // Load data from Supabase on mount
  useEffect(() => {
    refreshCCLRate();
  }, [refreshCCLRate]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [{ data: txData, error: txErr }, { data: priceData, error: priceErr }] = await Promise.all([
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('current_prices').select('*'),
        ]);

        if (txErr) throw new Error(txErr.message);
        if (priceErr) throw new Error(priceErr.message);

        setTransactions((txData ?? []).map(r => mapTransaction(r as Record<string, unknown>)));

        const pricesMap: Record<string, CurrentPrice> = {};
        for (const row of (priceData ?? [])) {
          const p = mapPrice(row as Record<string, unknown>);
          pricesMap[p.ticker] = p;
        }
        setCurrentPrices(pricesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'pricePerUnit'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        date: tx.date,
        type: tx.type,
        ticker: tx.ticker,
        asset_type: tx.assetType,
        quantity: tx.quantity,
        total_amount: tx.totalAmount,
        currency: tx.currency,
        exchange_rate: tx.exchangeRate ?? null,
        notes: tx.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    setTransactions(prev => [mapTransaction(data as Record<string, unknown>), ...prev]);
  }, []);

  const updateTransaction = useCallback(async (tx: Transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: tx.date,
        type: tx.type,
        ticker: tx.ticker,
        asset_type: tx.assetType,
        quantity: tx.quantity,
        total_amount: tx.totalAmount,
        currency: tx.currency,
        exchange_rate: tx.exchangeRate ?? null,
        notes: tx.notes ?? null,
      })
      .eq('id', tx.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    setTransactions(prev => prev.map(t => t.id === tx.id ? mapTransaction(data as Record<string, unknown>) : t));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updatePrice = useCallback(async (ticker: string, price: number, currency: 'ARS' | 'USD') => {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('current_prices')
      .upsert({ ticker, price, currency, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
    setCurrentPrices(prev => ({ ...prev, [ticker]: { ticker, price, currency, updatedAt: today } }));
  }, []);

  const updatePricesBulk = useCallback(async (prices: Record<string, CurrentPrice>) => {
    const rows = Object.values(prices).map(p => ({
      ticker: p.ticker,
      price: p.price,
      currency: p.currency,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('current_prices').upsert(rows);
    if (error) throw new Error(error.message);
    setCurrentPrices(prices);
  }, []);

  const importTransactions = useCallback(async (txs: Transaction[], replace = false) => {
    if (replace) {
      const { error: delErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) throw new Error(delErr.message);
    }

    const rows = txs.map(tx => ({
      id: tx.id || uuidv4(),
      date: tx.date,
      type: tx.type,
      ticker: tx.ticker,
      asset_type: tx.assetType,
      quantity: tx.quantity,
      total_amount: tx.totalAmount,
      currency: tx.currency,
      exchange_rate: tx.exchangeRate ?? null,
      notes: tx.notes ?? null,
    }));

    const { data, error } = await supabase.from('transactions').upsert(rows).select();
    if (error) throw new Error(error.message);

    const mapped = (data ?? []).map(r => mapTransaction(r as Record<string, unknown>));
    setTransactions(replace ? mapped : prev => [...mapped, ...prev]);
  }, []);

  const clearAllData = useCallback(async () => {
    const [{ error: txErr }, { error: priceErr }] = await Promise.all([
      supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('current_prices').delete().neq('ticker', ''),
    ]);
    if (txErr) throw txErr;
    if (priceErr) throw priceErr;
    setTransactions([]);
    setCurrentPrices({});
  }, []);

  const loadSampleData = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const txRows = SAMPLE_TRANSACTIONS.map(t => ({
      id: uuidv4(),
      date: t.date,
      type: t.type,
      ticker: t.ticker,
      asset_type: t.assetType,
      quantity: t.quantity,
      total_amount: t.totalAmount,
      currency: t.currency,
      exchange_rate: t.exchangeRate ?? null,
      notes: t.notes ?? null,
    }));

    const priceRows = SAMPLE_PRICES.map(p => ({
      ticker: p.ticker,
      price: p.price,
      currency: p.currency,
      updated_at: today,
    }));

    const [{ data: txData, error: txErr }, { error: priceErr }] = await Promise.all([
      supabase.from('transactions').insert(txRows).select(),
      supabase.from('current_prices').upsert(priceRows),
    ]);

    if (txErr) throw txErr;
    if (priceErr) throw priceErr;

    const mapped = (txData ?? []).map(r => mapTransaction(r as Record<string, unknown>));
    setTransactions(prev => [...mapped, ...prev]);

    const newPrices: Record<string, CurrentPrice> = {};
    for (const p of SAMPLE_PRICES) {
      newPrices[p.ticker] = { ...p, updatedAt: today };
    }
    setCurrentPrices(prev => ({ ...prev, ...newPrices }));
  }, []);

  return (
    <DataContext.Provider value={{
      transactions,
      currentPrices,
      isLoading,
      error,
      cclRate,
      refreshCCLRate,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updatePrice,
      updatePricesBulk,
      importTransactions,
      clearAllData,
      loadSampleData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
