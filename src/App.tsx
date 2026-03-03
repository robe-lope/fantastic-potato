import { useState } from 'react';
import './index.css';
import type { Page } from './types';
import { useTransactions } from './hooks/useTransactions';
import { MainLayout } from './components/Layout/MainLayout';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { TransactionForm } from './components/Transactions/TransactionForm';
import { TransactionsPage } from './components/Transactions/TransactionsPage';
import { ChartsPage } from './components/Charts/ChartsPage';
import { AssetDetailPage } from './components/AssetDetail/AssetDetailPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { ToastContainer, useToast } from './components/UI/Toast';
import { saveTransactions } from './data/store';

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  'nueva-operacion': 'Nueva Operación',
  operaciones: 'Todas las Operaciones',
  graficos: 'Gráficos',
  configuracion: 'Configuración',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const { transactions, add, update, remove, importTransactions, replaceAll } = useTransactions();
  const { toasts, showToast, removeToast } = useToast();

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedTicker(null);
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleClear = () => {
    replaceAll([]);
    saveTransactions([]);
  };

  const renderContent = () => {
    if (selectedTicker) {
      return (
        <AssetDetailPage
          ticker={selectedTicker}
          transactions={transactions}
          onBack={() => setSelectedTicker(null)}
          onUpdate={(tx) => { update(tx); showToast('Operación actualizada'); }}
          onDelete={(id) => { remove(id); showToast('Operación eliminada'); }}
          showToast={showToast}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            transactions={transactions}
            onTickerClick={handleTickerClick}
          />
        );

      case 'nueva-operacion':
        return (
          <div className="max-w-2xl">
            <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-6">
              <TransactionForm
                transactions={transactions}
                onSubmit={(tx) => {
                  add(tx);
                  showToast(tx.type === 'BUY' ? 'Compra registrada correctamente' : 'Venta registrada correctamente');
                }}
              />
            </div>
          </div>
        );

      case 'operaciones':
        return (
          <TransactionsPage
            transactions={transactions}
            onUpdate={(tx) => { update(tx); showToast('Operación actualizada'); }}
            onDelete={(id) => { remove(id); showToast('Operación eliminada'); }}
            onBulkImport={(txs) => { importTransactions(txs); }}
            onTickerClick={handleTickerClick}
            showToast={showToast}
          />
        );

      case 'graficos':
        return <ChartsPage transactions={transactions} />;

      case 'configuracion':
        return (
          <SettingsPage
            transactions={transactions}
            onImport={(txs, replace) => importTransactions(txs, replace)}
            onClear={handleClear}
            showToast={showToast}
          />
        );

      default:
        return null;
    }
  };

  const title = selectedTicker ? `Detalle: ${selectedTicker}` : pageTitles[currentPage];

  return (
    <>
      <MainLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        title={title}
      >
        {renderContent()}
      </MainLayout>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
