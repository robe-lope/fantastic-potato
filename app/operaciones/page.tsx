'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionsPage } from '@/components/transactions/TransactionsPage';
import { useData } from '@/contexts/DataContext';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function OperacionesPage() {
  const { transactions, updateTransaction, deleteTransaction, importTransactions } = useData();
  const { toasts, showToast, removeToast } = useToast();

  return (
    <MainLayout>
      <TransactionsPage
        transactions={transactions}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        onBulkImport={importTransactions}
        showToast={showToast}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  );
}
