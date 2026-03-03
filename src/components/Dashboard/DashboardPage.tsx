import type { Transaction } from '../../types';
import { usePortfolio } from '../../hooks/usePortfolio';
import { SummaryCards } from './SummaryCards';
import { HoldingsTable } from './HoldingsTable';

interface DashboardPageProps {
  transactions: Transaction[];
  onTickerClick: (ticker: string) => void;
}

export function DashboardPage({ transactions, onTickerClick }: DashboardPageProps) {
  const { holdings, summary } = usePortfolio(transactions);

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />

      <div>
        <h3 className="text-white font-semibold mb-4">Posiciones Actuales</h3>
        <HoldingsTable holdings={holdings} onTickerClick={onTickerClick} />
      </div>
    </div>
  );
}
