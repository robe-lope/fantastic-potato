import { useState } from 'react';
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatDate, formatARS, formatUSD } from '../../utils/formatters';
import { Modal } from '../UI/Modal';
import { ConfirmModal } from '../UI/Modal';
import { TransactionForm } from './TransactionForm';

interface TransactionTableProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  onUpdate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onTickerClick?: (ticker: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

type SortField = 'date' | 'ticker' | 'type' | 'quantity' | 'pricePerUnit' | 'totalAmount';

export function TransactionTable({
  transactions,
  allTransactions,
  onUpdate,
  onDelete,
  onTickerClick,
  showToast,
}: TransactionTableProps) {
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...transactions].sort((a, b) => {
    let va: string | number = a[sortField] as string | number;
    let vb: string | number = b[sortField] as string | number;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-medium text-slate-400 cursor-pointer hover:text-white select-none";

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg">📋</p>
        <p className="text-slate-400 mt-2">No hay operaciones registradas</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[#2d3348]">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1d29] border-b border-[#2d3348]">
            <tr>
              <th className={thClass} onClick={() => handleSort('date')}>
                <span className="flex items-center gap-1">Fecha <SortIcon field="date" /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('type')}>
                <span className="flex items-center gap-1">Tipo <SortIcon field="type" /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('ticker')}>
                <span className="flex items-center gap-1">Ticker <SortIcon field="ticker" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Activo</th>
              <th className={thClass} onClick={() => handleSort('quantity')}>
                <span className="flex items-center gap-1">Cantidad <SortIcon field="quantity" /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('pricePerUnit')}>
                <span className="flex items-center gap-1">Precio Unit. <SortIcon field="pricePerUnit" /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('totalAmount')}>
                <span className="flex items-center gap-1">Total <SortIcon field="totalAmount" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">T/C</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3348]">
            {sorted.map((tx, i) => (
              <tr
                key={tx.id}
                className={`transition-colors hover:bg-white/[0.03] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
              >
                <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{formatDate(tx.date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    tx.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {tx.type === 'BUY' ? 'COMPRA' : 'VENTA'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onTickerClick?.(tx.ticker)}
                    className="font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {tx.ticker}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    tx.assetType === 'CEDEAR'
                      ? 'bg-purple-900/40 text-purple-400'
                      : 'bg-orange-900/40 text-orange-400'
                  }`}>
                    {tx.assetType === 'CEDEAR' ? 'CEDEAR' : 'Acción'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">{tx.quantity.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 font-mono text-slate-200">
                  {tx.currency === 'ARS' ? formatARS(tx.pricePerUnit) : formatUSD(tx.pricePerUnit)}
                </td>
                <td className="px-4 py-3 font-mono font-medium text-white">
                  {tx.currency === 'ARS' ? formatARS(tx.totalAmount) : formatUSD(tx.totalAmount)}
                </td>
                <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                  {tx.exchangeRate ? `$${tx.exchangeRate.toLocaleString('es-AR')}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditTx(tx)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTx(tx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar Operación" size="lg">
        {editTx && (
          <TransactionForm
            initial={editTx}
            transactions={allTransactions}
            onSubmit={(tx) => {
              onUpdate(tx);
              setEditTx(null);
              showToast('Operación actualizada correctamente');
            }}
            onCancel={() => setEditTx(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={() => {
          if (deleteTx) {
            onDelete(deleteTx.id);
            showToast('Operación eliminada');
          }
          setDeleteTx(null);
        }}
        title="Eliminar operación"
        message={deleteTx ? `¿Confirmar eliminación de ${deleteTx.type === 'BUY' ? 'compra' : 'venta'} de ${deleteTx.quantity} ${deleteTx.ticker}?` : ''}
        confirmText="Eliminar"
        danger
      />
    </>
  );
}
