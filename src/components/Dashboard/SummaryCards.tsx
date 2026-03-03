import { DollarSign, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import type { PortfolioSummary } from '../../types';
import { formatARS, formatUSD, formatDate } from '../../utils/formatters';

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function Card({ title, value, subtitle, icon, color }: CardProps) {
  return (
    <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5 hover:border-[#3d4360] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className="text-white font-mono text-xl font-bold leading-tight truncate">{value}</p>
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
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Invertido ARS"
        value={formatARS(summary.totalInvestedARS)}
        subtitle={summary.totalInvestedUSD > 0 ? `≈ ${formatUSD(summary.totalInvestedUSD)} en USD` : undefined}
        icon={<DollarSign size={18} className="text-green-400" />}
        color="bg-green-900/30"
      />
      <Card
        title="Total Invertido USD"
        value={summary.totalInvestedUSD > 0 ? formatUSD(summary.totalInvestedUSD) : 'N/A'}
        subtitle="Operaciones en USD"
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
  );
}
