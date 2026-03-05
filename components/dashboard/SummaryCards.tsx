'use client';

import { DollarSign, TrendingUp, BarChart2, Calendar, TrendingDown } from 'lucide-react';
import type { PortfolioSummary } from '@/types';
import { formatARS, formatUSD, formatDate, formatPercentage } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PLRowProps {
  label: string;
  currentValue: string;
  gainLoss: number;
  gainLossFormatted: string;
  pct: number;
  assetsCount: number;
}

function PLRow({ label, currentValue, gainLoss, gainLossFormatted, pct, assetsCount }: PLRowProps) {
  const isGain = gainLoss >= 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
              Valor Actual del Portfolio <span className="text-slate-600">({label})</span>
            </p>
            <p className="text-white font-mono text-xl font-bold leading-tight truncate">{currentValue}</p>
            <p className="text-slate-500 text-xs mt-1.5">
              {assetsCount} activo{assetsCount !== 1 ? 's' : ''} con precio en {label}
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
              Ganancia / Pérdida <span className="text-slate-600">({label})</span>
            </p>
            <p className={`font-mono text-2xl font-bold leading-tight ${isGain ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
              {isGain ? '+' : '-'}{gainLossFormatted}
            </p>
            <p className="text-slate-500 text-xs mt-1.5">No realizada</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${isGain ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
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
              Rendimiento <span className="text-slate-600">({label})</span>
            </p>
            <p className={`font-mono text-xl font-bold leading-tight ${isGain ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
              {isGain ? '+' : ''}{formatPercentage(pct)}
            </p>
            <p className="text-slate-500 text-xs mt-1.5">Sobre activos con precio</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${isGain ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <BarChart2 size={18} className={isGain ? 'text-[#00c853]' : 'text-[#ff1744]'} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const hasPrimaryPrice = isUSD ? summary.assetsWithPriceUSD > 0 : summary.assetsWithPrice > 0;
  const hasSecondaryPrice = isUSD ? summary.assetsWithPrice > 0 : summary.assetsWithPriceUSD > 0;

  const primaryPL = isUSD
    ? {
        label: 'USD',
        currentValue: formatUSD(summary.currentTotalValueUSD),
        gainLoss: summary.unrealizedGainLossUSD,
        gainLossFormatted: formatUSD(Math.abs(summary.unrealizedGainLossUSD)),
        pct: summary.unrealizedGainLossPctUSD,
        assetsCount: summary.assetsWithPriceUSD,
      }
    : {
        label: 'ARS',
        currentValue: formatARS(summary.currentTotalValueARS),
        gainLoss: summary.unrealizedGainLossARS,
        gainLossFormatted: formatARS(Math.abs(summary.unrealizedGainLossARS)),
        pct: summary.unrealizedGainLossPctARS,
        assetsCount: summary.assetsWithPrice,
      };

  const secondaryPL = isUSD
    ? {
        label: 'ARS',
        currentValue: formatARS(summary.currentTotalValueARS),
        gainLoss: summary.unrealizedGainLossARS,
        gainLossFormatted: formatARS(Math.abs(summary.unrealizedGainLossARS)),
        pct: summary.unrealizedGainLossPctARS,
        assetsCount: summary.assetsWithPrice,
      }
    : {
        label: 'USD',
        currentValue: formatUSD(summary.currentTotalValueUSD),
        gainLoss: summary.unrealizedGainLossUSD,
        gainLossFormatted: formatUSD(Math.abs(summary.unrealizedGainLossUSD)),
        pct: summary.unrealizedGainLossPctUSD,
        assetsCount: summary.assetsWithPriceUSD,
      };

  return (
    <div className="space-y-4">
      {hasPrimaryPrice && <PLRow {...primaryPL} />}
      {hasSecondaryPrice && <PLRow {...secondaryPL} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title={isUSD ? 'Total Invertido USD' : 'Total Invertido ARS'}
          value={isUSD
            ? (summary.totalInvestedUSD > 0 ? formatUSD(summary.totalInvestedUSD) : 'N/A')
            : formatARS(summary.totalInvestedARS)}
          subtitle={isUSD
            ? (summary.totalInvestedARS > 0 ? `≈ ${formatARS(summary.totalInvestedARS)} en ARS` : undefined)
            : (summary.totalInvestedUSD > 0 ? `≈ ${formatUSD(summary.totalInvestedUSD)} en USD` : undefined)}
          icon={<DollarSign size={18} className="text-green-400" />}
          color="bg-green-900/30"
        />
        <Card
          title={isUSD ? 'Total Invertido ARS' : 'Total Invertido USD'}
          value={isUSD
            ? formatARS(summary.totalInvestedARS)
            : (summary.totalInvestedUSD > 0 ? formatUSD(summary.totalInvestedUSD) : 'N/A')}
          subtitle={isUSD ? 'En pesos' : 'En dólares'}
          icon={<TrendingUp size={18} className="text-blue-400" />}
          color="bg-blue-900/30"
        />
        <Card
          title="Activos en Cartera"
          value={String(summary.totalAssets)}
          subtitle={`${summary.totalTransactions} compras registradas`}
          icon={<BarChart2 size={18} className="text-purple-400" />}
          color="bg-purple-900/30"
        />
        <Card
          title="Período"
          value={summary.firstTransactionDate ? formatDate(summary.firstTransactionDate) : '—'}
          subtitle={summary.lastTransactionDate ? `Última: ${formatDate(summary.lastTransactionDate)}` : undefined}
          icon={<Calendar size={18} className="text-orange-400" />}
          color="bg-orange-900/30"
        />
      </div>
    </div>
  );
}
