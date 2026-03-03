import { useState } from 'react';
import { Search, Upload } from 'lucide-react';
import type { Transaction } from '../../types';
import { TransactionTable } from './TransactionTable';
import { BulkImport } from './BulkImport';
import { Modal } from '../UI/Modal';

interface TransactionsPageProps {
  transactions: Transaction[];
  onUpdate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onBulkImport: (txs: Transaction[]) => void;
  onTickerClick: (ticker: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function TransactionsPage({
  transactions,
  onUpdate,
  onDelete,
  onBulkImport,
  onTickerClick,
  showToast,
}: TransactionsPageProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'CEDEAR' | 'ACCION_LOCAL'>('ALL');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const filtered = transactions.filter(tx => {
    const matchSearch = !search ||
      tx.ticker.toLowerCase().includes(search.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(search.toLowerCase());
    const matchType = filter === 'ALL' || tx.type === filter;
    const matchAsset = assetFilter === 'ALL' || tx.assetType === assetFilter;
    return matchSearch && matchType && matchAsset;
  });

  const handleBulkImport = (txs: Transaction[]) => {
    onBulkImport(txs);
    setShowBulkImport(false);
    showToast(`${txs.length} operaciones importadas correctamente`);
  };

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ticker o notas..."
            className="w-full bg-[#1a1d29] border border-[#2d3348] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex rounded-lg overflow-hidden border border-[#2d3348]">
          {(['ALL', 'BUY', 'SELL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Todos' : f === 'BUY' ? 'Compras' : 'Ventas'}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-[#2d3348]">
          {(['ALL', 'CEDEAR', 'ACCION_LOCAL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setAssetFilter(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                assetFilter === f ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Todos' : f === 'CEDEAR' ? 'CEDEARs' : 'Locales'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowBulkImport(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1d29] border border-[#2d3348] text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm"
        >
          <Upload size={14} />
          Carga masiva
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-slate-400">
        <span>
          Mostrando <span className="text-white font-medium">{filtered.length}</span> de {transactions.length} operaciones
        </span>
      </div>

      <TransactionTable
        transactions={filtered}
        allTransactions={transactions}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onTickerClick={onTickerClick}
        showToast={showToast}
      />

      <Modal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} title="Carga Masiva de Operaciones" size="xl">
        <BulkImport
          onImport={handleBulkImport}
          onCancel={() => setShowBulkImport(false)}
        />
      </Modal>
    </div>
  );
}
