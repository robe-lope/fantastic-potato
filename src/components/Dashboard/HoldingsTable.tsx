import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react';
import type { Holding, SortField, SortDirection } from '../../types';
import { formatARS, formatUSD, formatNumber, formatPercentage } from '../../utils/formatters';

interface HoldingsTableProps {
  holdings: (Holding & { percentage: number })[];
  onTickerClick: (ticker: string) => void;
}

export function HoldingsTable({ holdings, onTickerClick }: HoldingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalInvestedARS');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    let va = a[sortField];
    let vb = b[sortField];
    if (typeof va === 'string') va = va.toLowerCase() as unknown as number;
    if (typeof vb === 'string') vb = vb.toLowerCase() as unknown as number;
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-medium text-slate-400 cursor-pointer hover:text-white select-none whitespace-nowrap";

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1a1d29] rounded-xl border border-[#2d3348]">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-slate-400">No hay activos en cartera</p>
        <p className="text-slate-600 text-sm mt-1">Agregá tu primera operación para comenzar</p>
      </div>
    );
  }

  const totalARS = holdings.reduce((sum, h) => sum + h.totalInvestedARS, 0);

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
              <span className="flex items-center gap-1">PPP (ARS) <SortIcon field="averageCostARS" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('totalInvestedARS')}>
              <span className="flex items-center gap-1">Total ARS <SortIcon field="totalInvestedARS" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('totalInvestedUSD')}>
              <span className="flex items-center gap-1">Total USD <SortIcon field="totalInvestedUSD" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('percentage')}>
              <span className="flex items-center gap-1">% Portfolio <SortIcon field="percentage" /></span>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ops.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2d3348]">
          {sorted.map((h, i) => (
            <tr
              key={h.ticker}
              className={`transition-colors hover:bg-white/[0.03] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
            >
              <td className="px-4 py-3">
                <button
                  onClick={() => onTickerClick(h.ticker)}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                    {h.ticker}
                  </span>
                  <ExternalLink size={10} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                </button>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  h.assetType === 'CEDEAR'
                    ? 'bg-purple-900/40 text-purple-400'
                    : 'bg-orange-900/40 text-orange-400'
                }`}>
                  {h.assetType === 'CEDEAR' ? 'CEDEAR' : 'Local'}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-slate-200">
                {formatNumber(h.totalQuantity, h.totalQuantity % 1 === 0 ? 0 : 4)}
              </td>
              <td className="px-4 py-3 font-mono text-slate-200">
                {h.averageCostARS > 0 ? formatARS(h.averageCostARS) : 'N/A'}
              </td>
              <td className="px-4 py-3 font-mono font-medium text-white">
                {h.totalInvestedARS > 0 ? formatARS(h.totalInvestedARS) : 'N/A'}
              </td>
              <td className="px-4 py-3 font-mono text-slate-300">
                {h.totalInvestedUSD > 0 ? formatUSD(h.totalInvestedUSD) : 'N/A'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-20 bg-[#0f1117] rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(h.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-300">{formatPercentage(h.percentage)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                {h.transactions.length}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-[#2d3348] bg-[#1a1d29]">
          <tr>
            <td colSpan={4} className="px-4 py-3 text-xs text-slate-400 font-medium">
              Total ({holdings.length} activos)
            </td>
            <td className="px-4 py-3 font-mono font-bold text-white">{formatARS(totalARS)}</td>
            <td className="px-4 py-3 font-mono text-slate-300">
              {formatUSD(holdings.reduce((s, h) => s + h.totalInvestedUSD, 0))}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-slate-400">100%</td>
            <td className="px-4 py-3 font-mono text-xs text-slate-400">
              {holdings.reduce((s, h) => s + h.transactions.length, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
