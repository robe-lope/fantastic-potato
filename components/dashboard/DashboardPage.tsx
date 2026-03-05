'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { SummaryCards } from './SummaryCards';
import { HoldingsTable } from './HoldingsTable';
import { fetchCurrentPrices, applyFetchedPrices } from '@/lib/priceFetcher';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export function DashboardPage() {
  const { transactions, currentPrices, updatePrice, updatePricesBulk } = useData();
  const { holdings, summary } = usePortfolio(transactions, currentPrices);
  const { toasts, showToast, removeToast } = useToast();
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchPrices = async () => {
    setIsFetching(true);
    try {
      const response = await fetchCurrentPrices(holdings);
      const updated = applyFetchedPrices(currentPrices, response.prices, response.fetchedAt);
      await updatePricesBulk(updated);
      const succeeded = response.prices.filter(p => p.price !== null).length;
      const failed = response.prices.filter(p => p.price === null).length;
      showToast(
        failed > 0
          ? `Precios actualizados: ${succeeded} de ${response.prices.length} tickers`
          : `Precios actualizados: ${succeeded} tickers`,
        succeeded > 0 ? 'success' : 'error',
      );
    } catch {
      showToast('Error al buscar precios', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handlePriceUpdate = async (ticker: string, price: number, currency: 'ARS' | 'USD') => {
    try {
      await updatePrice(ticker, price, currency);
      showToast(`Precio de ${ticker} actualizado`);
    } catch {
      showToast('Error al actualizar el precio', 'error');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <SummaryCards summary={summary} />

        <div>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3 className="text-white font-semibold">Posiciones Actuales</h3>
            <button
              onClick={handleFetchPrices}
              disabled={isFetching || holdings.length === 0}
              title="Buscar precios actuales en Yahoo Finance"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isFetching
                  ? 'bg-blue-600/30 text-blue-400 cursor-not-allowed'
                  : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 hover:border-blue-500/50'
              }`}
            >
              {isFetching
                ? <><Loader2 size={12} className="animate-spin" /> Buscando...</>
                : <><RefreshCw size={12} /> Actualizar precios</>
              }
            </button>
          </div>

          <HoldingsTable
            holdings={holdings}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
