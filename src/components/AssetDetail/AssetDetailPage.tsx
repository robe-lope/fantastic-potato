import { useMemo } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import type { Transaction } from '../../types';
import { formatARS, formatUSD, formatDate, formatNumber } from '../../utils/formatters';
import { calculateHoldings } from '../../utils/calculations';
import { TransactionTable } from '../Transactions/TransactionTable';

interface AssetDetailPageProps {
  ticker: string;
  transactions: Transaction[];
  onBack: () => void;
  onUpdate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const tooltipStyle = {
  backgroundColor: '#1a1d29',
  border: '1px solid #2d3348',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export function AssetDetailPage({
  ticker,
  transactions,
  onBack,
  onUpdate,
  onDelete,
  showToast,
}: AssetDetailPageProps) {
  const tickerTxs = useMemo(
    () => transactions.filter(t => t.ticker === ticker).sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, ticker]
  );

  const holdings = useMemo(() => calculateHoldings(transactions), [transactions]);
  const holding = holdings.find(h => h.ticker === ticker);

  // Price over time (buy transactions)
  const priceData = useMemo(() =>
    tickerTxs
      .filter(t => t.type === 'BUY')
      .map(t => ({
        date: t.date,
        label: formatDate(t.date),
        precio: t.pricePerUnit,
        moneda: t.currency,
      })),
    [tickerTxs]
  );

  // Accumulated quantity over time
  const quantityData = useMemo(() => {
    let qty = 0;
    return tickerTxs.map(t => {
      qty += t.type === 'BUY' ? t.quantity : -t.quantity;
      return {
        label: formatDate(t.date),
        cantidad: qty,
        type: t.type,
      };
    });
  }, [tickerTxs]);

  if (!holding || tickerTxs.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        <div className="text-center py-20">
          <p className="text-slate-400">No se encontraron datos para {ticker}</p>
        </div>
      </div>
    );
  }

  const firstBuy = tickerTxs.filter(t => t.type === 'BUY')[0];
  const lastBuy = tickerTxs.filter(t => t.type === 'BUY').at(-1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl font-mono">{ticker}</h2>
            <p className="text-slate-400 text-xs">
              {holding.assetType === 'CEDEAR' ? 'CEDEAR' : 'Acción Local'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Cantidad actual</p>
          <p className="text-white font-mono font-bold text-lg">{formatNumber(holding.totalQuantity, 0)}</p>
        </div>
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">PPP (ARS)</p>
          <p className="text-white font-mono font-bold text-lg">
            {holding.averageCostARS > 0 ? formatARS(holding.averageCostARS) : 'N/A'}
          </p>
        </div>
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total invertido</p>
          <p className="text-white font-mono font-bold text-lg">
            {holding.totalInvestedARS > 0 ? formatARS(holding.totalInvestedARS) : formatUSD(holding.totalInvestedUSD)}
          </p>
        </div>
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Operaciones</p>
          <p className="text-white font-mono font-bold text-lg">{tickerTxs.length}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {firstBuy && `Desde ${formatDate(firstBuy.date)}`}
          </p>
        </div>
      </div>

      {/* Periodo */}
      {firstBuy && lastBuy && (
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl px-5 py-3 flex gap-8 text-sm">
          <div>
            <span className="text-slate-400">Primera compra: </span>
            <span className="text-white font-medium">{formatDate(firstBuy.date)}</span>
            <span className="text-slate-500 ml-2 font-mono text-xs">
              {firstBuy.currency === 'ARS' ? formatARS(firstBuy.pricePerUnit) : formatUSD(firstBuy.pricePerUnit)}/u
            </span>
          </div>
          <div>
            <span className="text-slate-400">Última compra: </span>
            <span className="text-white font-medium">{formatDate(lastBuy.date)}</span>
            <span className="text-slate-500 ml-2 font-mono text-xs">
              {lastBuy.currency === 'ARS' ? formatARS(lastBuy.pricePerUnit) : formatUSD(lastBuy.pricePerUnit)}/u
            </span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price over time */}
        {priceData.length > 1 && (
          <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">Precio de compra en el tiempo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="precio" stroke="#2979ff" strokeWidth={2} dot={{ r: 4, fill: '#2979ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Accumulated quantity */}
        {quantityData.length > 0 && (
          <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">Cantidad acumulada</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={quantityData}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number | undefined) => [val ?? 0, 'Cantidad']} />
                <Area type="monotone" dataKey="cantidad" stroke="#00c853" fill="url(#colorQty)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transactions table */}
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm">Historial de operaciones de {ticker}</h3>
        <TransactionTable
          transactions={tickerTxs}
          allTransactions={transactions}
          onUpdate={onUpdate}
          onDelete={onDelete}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
