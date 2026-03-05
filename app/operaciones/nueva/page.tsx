'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useData } from '@/contexts/DataContext';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import type { Transaction } from '@/types';

export default function NuevaOperacionPage() {
  const router = useRouter();
  const { transactions, addTransaction } = useData();
  const { toasts, showToast, removeToast } = useToast();

  const handleSubmit = async (tx: Transaction) => {
    await addTransaction(tx);
    showToast(tx.type === 'BUY' ? 'Compra registrada' : 'Venta registrada');
    router.push('/operaciones');
  };

  return (
    <MainLayout>
      <div className="max-w-2xl">
        <h2 className="text-white font-semibold text-lg mb-6">Nueva Operación</h2>
        <div className="bg-[#1a1d29] border border-[#2d3348] rounded-2xl p-6">
          <TransactionForm
            transactions={transactions}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/operaciones')}
          />
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  );
}
