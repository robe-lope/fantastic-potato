'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Pencil, Check, X } from 'lucide-react';
import type { Holding, SortField, SortDirection } from '@/types';
import { formatARS, formatUSD, formatNumber, formatPercentage } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';

interface HoldingsTableProps {
  holdings: (Holding & { percentage: number })[];
  onPriceUpdate: (ticker: string, price: number, currency: 'ARS' | 'USD') => void;
}

export function HoldingsTable({ holdings, onPriceUpdate }: HoldingsTableProps) {
  const router = useRouter();
  const { currency } = useCurrency();
  const isUSD = currency === 'USD';
  const fmt = (v: number) => isUSD ? formatUSD(v) : formatARS(v);

  const [sortField, setSortField] = useState<SortField>('totalInvestedARS');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState<'ARS' | 'USD'>('ARS');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    const va = (a[sortField] ?? -Infinity) as number | string;
    const vb = (b[sortField] ?? -Infinity) as number | string;
    const na = typeof va === 'string' ? va.toLowerCase() : va;
    const nb = typeof vb === 'string' ? vb.toLowerCase() : vb;
    if (na < nb) return sortDir === 'asc' ? -1 : 1;
    if (na > nb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const startEdit = (h: Holding & { percentage: number }) => {
    setEditingTicker(h.ticker);
    setEditPrice(h.currentPricePerUnit !== undefined ? String(h.currentPricePerUnit) : '');
    setEditCurrency(h.currentPriceCurrency ?? 'ARS');
  };

  const confirmEdit = (ticker: string) => {
    const price = parseFloat(editPrice.replace(',', '.'));
    if (!isNaN(price) && price > 0) {
      onPriceUpdate(ticker, price, editCurrency);
    }
    setEditingTicker(null);
  };

  const cancelEdit = () => setEditingTicker(null);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thClass = "px-3 py-3 text-left text-xs font-medium text-slate-400 cursor-pointer hover:text-white select-none whitespace-nowrap";
  const thNC = "px-3 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap";

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1a1d29] rounded-xl border border-[#2d3348]">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-slate-400">No hay activos en cartera</p>
        <p className="text-slate-600 text-sm mt-1">Agregá tu primera operación para comenzar</p>
      </div>
    );
  }

  const totalInvested = isUSD
    ? holdings.reduce((s, h) => s + h.totalInvestedUSD, 0)
    : holdings.reduce((s, h) => s + h.totalInvestedARS, 0);

  const totalCurrent = isUSD
    ? holdings.reduce((s, h) => s + (h.currentTotalValueUSD ?? 0), 0)
    : holdings.reduce((s, h) => s + (h.currentTotalValueARS ?? 0), 0);
  const totalGain = isUSD
    ? holdings.reduce((s, h) => s + (h.unrealizedGainLossUSD ?? 0), 0)
    : holdings.reduce((s, h) => s + (h.unrealizedGainLossARS ?? 0), 0);

  const portfolioTotal = isUSD
    ? holdings.reduce((s, h) => s + h.totalInvestedUSD, 0)
    : holdings.reduce((s, h) => s + h.totalInvestedARS, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2d3348]">
      <table className="w-full text-sm">
        <thead className="bg-[#1a1d29] border-b border-[#2d3348]">
          <tr>
            <th className={thClass} onClick={() => handleSort('ticker')}>
              <span className="flex items-center gap-1">Ticker <SortIcon field="ticker" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('assetType')}>
              <span className="flex items-center gap-1">Tipo <SortIcon field="assetType" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('totalQuantity')}>
              <span className="flex items-center gap-1">Cantidad <SortIcon field="totalQuantity" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('averageCostARS')}>
              <span className="flex items-center gap-1">PPP <SortIcon field="averageCostARS" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('totalInvestedARS')}>
              <span className="flex items-center gap-1">Invertido <SortIcon field="totalInvestedARS" /></span>
            </th>
            <th className={thNC}>Precio Actual</th>
            <th className={thClass} onClick={() => handleSort('currentTotalValue')}>
              <span className="flex items-center gap-1">Valor Actual <SortIcon field="currentTotalValue" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('unrealizedGainLoss')}>
              <span className="flex items-center gap-1">G/P $ <SortIcon field="unrealizedGainLoss" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('unrealizedGainLossPct')}>
              <span className="flex items-center gap-1">G/P % <SortIcon field="unrealizedGainLossPct" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('percentage')}>
              <span className="flex items-center gap-1">% Cartera <SortIcon field="percentage" /></span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2d3348]">
          {sorted.map((h, i) => {
            const isEditing = editingTicker === h.ticker;
            const gainLossVal = isUSD ? h.unrealizedGainLossUSD : h.unrealizedGainLossARS;
            const gainLossPctVal = isUSD ? h.unrealizedGainLossPctUSD : h.unrealizedGainLossPctARS;
            const currentValDisplay = isUSD ? h.currentTotalValueUSD : h.currentTotalValueARS;
            const hasGain = gainLossVal !== undefined && gainLossVal >= 0;
            const gainColor = gainLossVal === undefined || hasGain ? 'text-[#00c853]' : 'text-[#ff1744]';

            const invested = isUSD ? h.totalInvestedUSD : h.totalInvestedARS;
            const gainLoss = gainLossVal ?? 0;
            const total = Math.max(invested + Math.abs(gainLoss), invested, 1);
            const investedPct = (invested / total) * 100;
            const gainPct = Math.abs(gainLoss / total) * 100;

            return (
              <tr
                key={h.ticker}
                className={`transition-colors hover:bg-white/[0.03] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
              >
                <td className="px-3 py-3">
                  <button onClick={() => router.push(`/activo/${h.ticker}`)} className="flex items-center gap-1.5 group">
                    <span className="font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                      {h.ticker}
                    </span>
                    <ExternalLink size={10} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </button>
                </td>

                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    h.assetType === 'CEDEAR'
                      ? 'bg-purple-900/40 text-purple-400'
                      : 'bg-orange-900/40 text-orange-400'
                  }`}>
                    {h.assetType === 'CEDEAR' ? 'CEDEAR' : 'Local'}
                  </span>
                </td>

                <td className="px-3 py-3 font-mono text-slate-200">
                  {formatNumber(h.totalQuantity, h.totalQuantity % 1 === 0 ? 0 : 4)}
                </td>

                <td className="px-3 py-3 font-mono text-slate-400 text-xs">
                  {isUSD
                    ? (h.averageCostUSD > 0 ? formatUSD(h.averageCostUSD) : 'N/A')
                    : (h.averageCostARS > 0 ? formatARS(h.averageCostARS) : 'N/A')}
                </td>

                <td className="px-3 py-3">
                  <div>
                    <span className="font-mono font-medium text-white text-xs">
                      {isUSD
                        ? (h.totalInvestedUSD > 0 ? formatUSD(h.totalInvestedUSD) : <span className="text-slate-600">—</span>)
                        : (h.totalInvestedARS > 0 ? formatARS(h.totalInvestedARS) : 'N/A')}
                    </span>
                    {gainLossVal !== undefined && (
                      <div className="flex h-1 rounded-full overflow-hidden mt-1 w-20 bg-[#0f1117]">
                        <div className="bg-[#2979ff] h-full" style={{ width: `${investedPct}%` }} />
                        <div
                          className={`h-full ${hasGain ? 'bg-[#00c853]' : 'bg-[#ff1744]'}`}
                          style={{ width: `${gainPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-3 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editCurrency}
                        onChange={e => setEditCurrency(e.target.value as 'ARS' | 'USD')}
                        className="bg-[#0f1117] border border-[#2d3348] text-slate-300 rounded text-xs px-1 py-1"
                      >
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        autoFocus
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmEdit(h.ticker);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-24 bg-[#0f1117] border border-blue-500 text-white rounded text-xs px-2 py-1 font-mono"
                        placeholder="Precio"
                      />
                      <button onClick={() => confirmEdit(h.ticker)} className="text-[#00c853] hover:text-green-300">
                        <Check size={13} />
                      </button>
                      <button onClick={cancelEdit} className="text-slate-500 hover:text-white">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(h)}
                      className="flex items-center gap-1.5 group"
                    >
                      {h.currentPricePerUnit !== undefined ? (
                        <span className="font-mono text-xs text-slate-200 group-hover:text-white">
                          {h.currentPriceCurrency === 'ARS'
                            ? formatARS(h.currentPricePerUnit)
                            : formatUSD(h.currentPricePerUnit)}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs group-hover:text-slate-400">—</span>
                      )}
                      <Pencil size={10} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                  )}
                </td>

                <td className="px-3 py-3 font-mono text-xs">
                  {currentValDisplay !== undefined ? (
                    <span className="text-slate-200">
                      {isUSD ? formatUSD(currentValDisplay) : formatARS(currentValDisplay)}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                <td className="px-3 py-3 font-mono text-xs">
                  {gainLossVal !== undefined ? (
                    <span className={gainColor}>
                      {gainLossVal >= 0 ? '+' : ''}
                      {isUSD ? formatUSD(gainLossVal) : formatARS(gainLossVal)}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                <td className="px-3 py-3 font-mono text-xs">
                  {gainLossPctVal !== undefined ? (
                    <span className={`font-medium ${gainColor}`}>
                      {gainLossPctVal >= 0 ? '+' : ''}
                      {formatPercentage(gainLossPctVal)}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                <td className="px-3 py-3">
                  {(() => {
                    const investedAmt = isUSD ? h.totalInvestedUSD : h.totalInvestedARS;
                    const pct = portfolioTotal > 0 ? (investedAmt / portfolioTotal) * 100 : 0;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-16 bg-[#0f1117] rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="font-mono text-xs text-slate-300">{formatPercentage(pct)}</span>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-[#2d3348] bg-[#1a1d29]">
          <tr>
            <td colSpan={4} className="px-3 py-3 text-xs text-slate-400 font-medium">
              Total ({holdings.length} activos)
            </td>
            <td className="px-3 py-3 font-mono font-bold text-white text-xs">
              {totalInvested > 0 ? fmt(totalInvested) : '—'}
            </td>
            <td className="px-3 py-3 text-slate-600 text-xs">—</td>
            <td className="px-3 py-3 font-mono text-slate-300 text-xs">
              {totalCurrent > 0 ? fmt(totalCurrent) : '—'}
            </td>
            <td className={`px-3 py-3 font-mono font-bold text-xs ${totalGain >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
              {totalCurrent > 0 ? `${totalGain >= 0 ? '+' : ''}${fmt(totalGain)}` : '—'}
            </td>
            <td colSpan={2} className="px-3 py-3 font-mono text-xs text-slate-400">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
