'use client';

import { DollarSign, TrendingUp, BarChart2, Calendar, TrendingDown } from 'lucide-react';
import type { PortfolioSummary } from '@/types';
import { formatARS, formatUSD, formatDate, formatPercentage } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  valueColor?: string;
}

function Card({ title, value, subtitle, icon, color, valueColor }: CardProps) {
  return (
    <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className={`font-mono text-xl font-bold leading-tight truncate ${valueColor ?? 'text-white'}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { currency } = useCurrency();
  const isUSD = currency === 'USD';

  const currentValue = isUSD ? summary.currentTotalValueUSD : summary.currentTotalValueARS;
  const gainLoss = isUSD ? summary.unrealizedGainLossUSD : summary.unrealizedGainLossARS;
  const gainLossPct = isUSD ? summary.unrealizedGainLossPctUSD : summary.unrealizedGainLossPctARS;
  const invested = isUSD ? summary.totalInvestedUSD : summary.totalInvestedARS;
  const assetsWithPrice = isUSD ? summary.assetsWithPriceUSD : summary.assetsWithPrice;
  const fmt = (v: number) => isUSD ? formatUSD(v) : formatARS(v);

  const isGain = gainLoss >= 0;
  const gainColor = isGain ? 'text-[#00c853]' : 'text-[#ff1744]';
  const gainBg = isGain ? 'bg-green-900/30' : 'bg-red-900/30';
  const hasPrice = assetsWithPrice > 0;

  return (
    <div className="space-y-4">
      {/* Fila de P&L — solo cuando hay precios cargados */}
      {hasPrice && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Valor Actual del Portfolio
                </p>
                <p className="text-white font-mono text-xl font-bold leading-tight truncate">
                  {fmt(currentValue)}
                </p>
                <p className="text-slate-500 text-xs mt-1.5">
                  {assetsWithPrice} activo{assetsWithPrice !== 1 ? 's' : ''} con precio en {currency}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 bg-blue-900/30">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Ganancia / Pérdida
                </p>
                <p className={`font-mono text-2xl font-bold leading-tight ${gainColor}`}>
                  {isGain ? '+' : '-'}{fmt(Math.abs(gainLoss))}
                </p>
                <p className="text-slate-500 text-xs mt-1.5">No realizada</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${gainBg}`}>
                {isGain
                  ? <TrendingUp size={18} className="text-[#00c853]" />
                  : <TrendingDown size={18} className="text-[#ff1744]" />
                }
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Rendimiento
                </p>
                <p className={`font-mono text-xl font-bold leading-tight ${gainColor}`}>
                  {isGain ? '+' : ''}{formatPercentage(gainLossPct)}
                </p>
                <p className="text-slate-500 text-xs mt-1.5">Sobre activos con precio</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${gainBg}`}>
                <BarChart2 size={18} className={gainColor} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title={`Total Invertido (${currency})`}
          value={invested > 0 ? fmt(invested) : 'N/A'}
          subtitle={hasPrice ? `Valor actual: ${fmt(currentValue)}` : 'Sin precios cargados'}
          icon={<DollarSign size={18} className="text-green-400" />}
          color="bg-green-900/30"
        />
        <Card
          title="Activos en Cartera"
          value={String(summary.totalAssets)}
          subtitle={`${summary.totalTransactions} compras registradas`}
          icon={<BarChart2 size={18} className="text-purple-400" />}
          color="bg-purple-900/30"
        />
        <Card
          title="Primera Inversión"
          value={summary.firstTransactionDate ? formatDate(summary.firstTransactionDate) : '—'}
          subtitle="Fecha de inicio"
          icon={<Calendar size={18} className="text-orange-400" />}
          color="bg-orange-900/30"
        />
        <Card
          title="Última Operación"
          value={summary.lastTransactionDate ? formatDate(summary.lastTransactionDate) : '—'}
          subtitle={hasPrice ? `${assetsWithPrice} con precio actualizado` : 'Sin precios cargados'}
          icon={<Calendar size={18} className="text-blue-400" />}
          color="bg-blue-900/30"
        />
      </div>
    </div>
  );
}
