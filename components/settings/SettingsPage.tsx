'use client';

import { useRef, useState } from 'react';
import { Download, Upload, Trash2, FileJson, FileText, AlertCircle } from 'lucide-react';
import type { Transaction } from '@/types';
import { exportToCSV } from '@/lib/csvParser';
import { ConfirmModal } from '@/components/ui/Modal';
import { useData } from '@/contexts/DataContext';

interface SettingsPageProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SettingsPage({ showToast }: SettingsPageProps) {
  const { transactions, importTransactions, clearAllData, loadSampleData } = useData();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portfolio exportado como JSON');
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portfolio exportado como CSV');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Transaction[];
        if (!Array.isArray(data)) throw new Error('Formato inválido');
        await importTransactions(data);
        showToast(`${data.length} operaciones importadas`);
      } catch {
        showToast('Error al importar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSampleData = async () => {
    await loadSampleData();
    showToast('Operaciones de ejemplo cargadas');
  };

  const handleClear = async () => {
    await clearAllData();
    showToast('Todos los datos eliminados');
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-5">{title}</h3>
      {children}
    </div>
  );

  const ActionButton = ({
    onClick,
    icon,
    label,
    description,
    variant = 'default',
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    description: string;
    variant?: 'default' | 'danger';
  }) => (
    <div className="flex items-start gap-4 py-4 border-b border-[#2d3348] last:border-b-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        variant === 'danger' ? 'bg-red-900/30' : 'bg-blue-900/30'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-slate-400 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
          variant === 'danger'
            ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/50'
            : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-700/50'
        }`}
      >
        {label}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl px-6 py-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={14} className="text-slate-400" />
          <span className="text-slate-400 text-sm">Estado actual</span>
        </div>
        <p className="text-white text-sm">
          <span className="font-mono font-bold text-blue-400">{transactions.length}</span>
          {' '}operaciones almacenadas en Supabase
        </p>
      </div>

      <Section title="Exportar datos">
        <ActionButton
          onClick={handleExportJSON}
          icon={<FileJson size={18} className="text-blue-400" />}
          label="Exportar a JSON"
          description="Descargá todas tus operaciones como archivo JSON para hacer backup"
        />
        <ActionButton
          onClick={handleExportCSV}
          icon={<FileText size={18} className="text-blue-400" />}
          label="Exportar a CSV"
          description="Descargá las operaciones en formato CSV para abrir en Excel u otras apps"
        />
      </Section>

      <Section title="Importar datos">
        <ActionButton
          onClick={() => jsonInputRef.current?.click()}
          icon={<Upload size={18} className="text-green-400" />}
          label="Importar desde JSON"
          description="Cargá un archivo JSON previamente exportado. Agrega las operaciones a las existentes."
          variant="default"
        />
        <input ref={jsonInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />

        <ActionButton
          onClick={handleLoadSampleData}
          icon={<Download size={18} className="text-green-400" />}
          label="Cargar datos de ejemplo"
          description="Agrega un set de operaciones de muestra para explorar la app"
          variant="default"
        />
      </Section>

      <Section title="Zona peligrosa">
        <ActionButton
          onClick={() => setConfirmClear(true)}
          icon={<Trash2 size={18} className="text-red-400" />}
          label="Borrar todos los datos"
          description="Elimina permanentemente todas las operaciones de Supabase. Esta acción no se puede deshacer."
          variant="danger"
        />
      </Section>

      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClear}
        title="Borrar todos los datos"
        message="¿Estás seguro? Se eliminarán permanentemente todas las operaciones. Esta acción no se puede deshacer."
        confirmText="Sí, borrar todo"
        danger
      />
    </div>
  );
}
