'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Loader2, AlertTriangle, Clock } from 'lucide-react';
import type { CurrentPrice } from '@/types';
import { useData } from '@/contexts/DataContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { formatDate, formatARS, formatUSD } from '@/lib/formatters';
import { fetchCurrentPrices, applyFetchedPrices } from '@/lib/priceFetcher';

interface PriceRow {
  ticker: string;
  assetType: 'CEDEAR' | 'ACCION_LOCAL';
  quantity: number;
  price: string;
  currency: 'ARS' | 'USD';
  updatedAt: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

interface UpdatePricesPageProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function UpdatePricesPage({ showToast }: UpdatePricesPageProps) {
  const { transactions, currentPrices, updatePrice, updatePricesBulk, cclRate, refreshCCLRate } = useData();
  const { holdings } = usePortfolio(transactions, currentPrices, cclRate ?? undefined);
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [marketClosed, setMarketClosed] = useState(false);
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);

  useEffect(() => {
    const newRows: PriceRow[] = holdings.map(h => {
      const cp = currentPrices[h.ticker];
      return {
        ticker: h.ticker,
        assetType: h.assetType,
        quantity: h.totalQuantity,
        price: cp ? String(cp.price) : '',
        currency: cp ? cp.currency : 'ARS',
        updatedAt: cp ? cp.updatedAt : '',
      };
    });
    setRows(newRows);
  }, [holdings, currentPrices]);

  const updateRow = (ticker: string, field: keyof PriceRow, value: string) => {
    setRows(prev => prev.map(r => r.ticker === ticker ? { ...r, [field]: value } : r));
  };

  const handleFetchPrices = async () => {
    setIsFetching(true);
    setServerError(null);
    setMarketClosed(false);

    try {
      const [response] = await Promise.all([
        fetchCurrentPrices(holdings),
        refreshCCLRate(),
      ]);
      const updated = applyFetchedPrices(currentPrices, response.prices, response.fetchedAt);
      await updatePricesBulk(updated);

      const succeeded = response.prices.filter(p => p.price !== null).length;
      const failed = response.prices.filter(p => p.price === null).length;
      const closed = response.prices.some(p =>
        p.marketState === 'CLOSED' || p.marketState === 'PRE' || p.marketState === 'POST',
      );

      setMarketClosed(closed);
      setLastFetchAt(new Date().toLocaleTimeString('es-AR'));

      if (failed > 0) {
        showToast(
          `Precios actualizados: ${succeeded} de ${response.prices.length} tickers (${failed} no encontrado${failed !== 1 ? 's' : ''})`,
          succeeded > 0 ? 'success' : 'error',
        );
      } else {
        showToast(`Precios actualizados: ${succeeded} de ${succeeded} tickers`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setServerError(msg);
      showToast('Error al buscar precios', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveAll = async () => {
    const today = todayISO();
    let savedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      if (!row.price.trim()) continue;
      const price = parseFloat(row.price.replace(',', '.'));
      if (isNaN(price) || price <= 0) { errorCount++; continue; }
      await updatePrice(row.ticker, price, row.currency as 'ARS' | 'USD');
      savedCount++;
    }

    if (errorCount > 0) {
      showToast(`${errorCount} precio${errorCount !== 1 ? 's' : ''} con valor inválido ignorado${errorCount !== 1 ? 's' : ''}`, 'error');
    }
    if (savedCount > 0) {
      showToast(`${savedCount} precio${savedCount !== 1 ? 's' : ''} actualizado${savedCount !== 1 ? 's' : ''}`);
    }
  };

  const handleSaveRow = async (ticker: string) => {
    const row = rows.find(r => r.ticker === ticker);
    if (!row) return;
    const price = parseFloat(row.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) { showToast('Precio inválido', 'error'); return; }
    await updatePrice(ticker, price, row.currency as 'ARS' | 'USD');
    showToast(`Precio de ${ticker} actualizado`);
  };

  if (holdings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">💰</p>
        <p className="text-slate-400">No hay activos en cartera</p>
        <p className="text-slate-600 text-sm mt-1">Agregá operaciones para poder actualizar precios</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-sm mb-1">Buscar precios automáticamente</h3>
            <p className="text-slate-500 text-xs">
              Consulta Yahoo Finance en tiempo real vía la API interna. Los precios en ARS se convierten a USD usando el tipo de cambio CCL.
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {cclRate && (
                <span className="text-xs text-emerald-400 font-mono">
                  CCL: {formatARS(cclRate)}
                </span>
              )}
              {lastFetchAt && !serverError && (
                <p className="text-slate-600 text-xs flex items-center gap-1">
                  <Clock size={10} /> Última búsqueda: {lastFetchAt}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleFetchPrices}
            disabled={isFetching}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
              isFetching
                ? 'bg-blue-600/50 text-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isFetching
              ? <><Loader2 size={15} className="animate-spin" /> Buscando precios...</>
              : <><RefreshCw size={15} /> Buscar precios actuales</>
            }
          </button>
        </div>

        {marketClosed && !serverError && (
          <div className="mt-3 flex items-center gap-2 text-yellow-500/80 text-xs bg-yellow-900/10 border border-yellow-900/30 rounded-lg px-3 py-2">
            <Clock size={13} />
            Precios al cierre del último día hábil (mercado cerrado o fuera de horario)
          </div>
        )}

        {serverError && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
            <AlertTriangle size={13} />
            {serverError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">O ingresá los precios manualmente:</p>
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1d29] border border-[#2d3348] hover:border-[#3d4360] text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <Save size={14} />
          Guardar todos
        </button>
      </div>

      <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#2d3348]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Ticker</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Cantidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Precio Actual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Moneda</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Últ. Actualización</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                {cclRate ? 'Precio en USD' : 'Precio (moneda orig.)'}
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3348]">
            {rows.map((row, i) => {
              const price = parseFloat(row.price.replace(',', '.'));
              const hasPrice = !isNaN(price) && price > 0;

              return (
                <tr
                  key={row.ticker}
                  className={`transition-colors hover:bg-white/[0.03] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-blue-400">{row.ticker}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      row.assetType === 'CEDEAR'
                        ? 'bg-purple-900/40 text-purple-400'
                        : 'bg-orange-900/40 text-orange-400'
                    }`}>
                      {row.assetType === 'CEDEAR' ? 'CEDEAR' : 'Local'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {row.quantity % 1 === 0 ? row.quantity : row.quantity.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.price}
                      onChange={e => updateRow(row.ticker, 'price', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveRow(row.ticker)}
                      className="w-32 bg-[#0f1117] border border-[#2d3348] focus:border-blue-500 text-white rounded-lg text-sm px-3 py-1.5 font-mono transition-colors outline-none"
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.currency}
                      onChange={e => updateRow(row.ticker, 'currency', e.target.value)}
                      className="bg-[#0f1117] border border-[#2d3348] text-slate-300 rounded-lg text-sm px-2 py-1.5 transition-colors outline-none"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {row.updatedAt ? formatDate(row.updatedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {hasPrice ? (() => {
                      if (cclRate && row.currency === 'ARS') {
                        return (
                          <div>
                            <span className="text-emerald-400 font-medium">{formatUSD(price / cclRate)}</span>
                            <span className="block text-slate-600 text-[10px]">{formatARS(price)}</span>
                          </div>
                        );
                      }
                      return <span className="text-slate-300">{row.currency === 'ARS' ? formatARS(price) : formatUSD(price)}</span>;
                    })() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSaveRow(row.ticker)}
                      title="Guardar este precio"
                      className="p-1.5 text-slate-500 hover:text-[#00c853] transition-colors rounded"
                    >
                      <Save size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-xs">
        Los precios se guardan en Supabase. Actualizalos cuando quieras ver tu ganancia/pérdida actualizada.
      </p>
    </div>
  );
}
