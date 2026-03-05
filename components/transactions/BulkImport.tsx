'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, FileJson } from 'lucide-react';
import type { Transaction } from '@/types';
import { parseCSV } from '@/lib/csvParser';
import { v4 as uuidv4 } from 'uuid';
import { todayISO } from '@/lib/formatters';

interface BulkImportProps {
  onImport: (transactions: Transaction[]) => void;
  onCancel: () => void;
}

interface TableRow {
  date: string;
  type: string;
  ticker: string;
  assetType: string;
  quantity: string;
  totalAmount: string;
  currency: string;
  exchangeRate: string;
  notes: string;
}

const emptyRow = (): TableRow => ({
  date: todayISO(),
  type: 'BUY',
  ticker: '',
  assetType: 'CEDEAR',
  quantity: '',
  totalAmount: '',
  currency: 'ARS',
  exchangeRate: '',
  notes: '',
});

export function BulkImport({ onImport, onCancel }: BulkImportProps) {
  const [mode, setMode] = useState<'csv' | 'json' | 'table'>('csv');
  const [rows, setRows] = useState<TableRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);
  const [pendingTxs, setPendingTxs] = useState<Transaction[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetFileState = () => {
    setFileError(null);
    setFileSuccess(null);
    setPendingTxs(null);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetFileState();
    try {
      const txs = await parseCSV(file);
      if (txs.length === 0) {
        setFileError('El archivo no contiene operaciones válidas');
        return;
      }
      setFileSuccess(`${txs.length} operaciones encontradas. Haz clic en "Importar" para confirmar.`);
      setPendingTxs(txs);
    } catch {
      setFileError('Error al parsear el archivo CSV');
    }
  };

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetFileState();
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error('El archivo debe contener un array de operaciones');
        const txs: Transaction[] = data.map((item: Partial<Transaction>) => ({
          id: item.id || uuidv4(),
          date: item.date ?? todayISO(),
          type: (item.type === 'BUY' || item.type === 'SELL') ? item.type : 'BUY',
          ticker: (item.ticker ?? '').toUpperCase(),
          assetType: (item.assetType === 'ACCION_LOCAL') ? 'ACCION_LOCAL' : 'CEDEAR',
          quantity: Number(item.quantity ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          pricePerUnit: Number(item.pricePerUnit ?? 0),
          currency: (item.currency === 'USD') ? 'USD' : 'ARS',
          exchangeRate: item.exchangeRate ? Number(item.exchangeRate) : undefined,
          notes: item.notes || undefined,
        }));
        const valid = txs.filter(t => t.ticker && t.quantity > 0 && t.totalAmount > 0);
        if (valid.length === 0) throw new Error('No se encontraron operaciones válidas');
        setFileSuccess(`${valid.length} operaciones encontradas. Haz clic en "Importar" para confirmar.`);
        setPendingTxs(valid);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Error al parsear el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileImport = () => {
    if (pendingTxs) onImport(pendingTxs);
  };

  const updateRow = (i: number, field: keyof TableRow, value: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleTableImport = () => {
    const txs: Transaction[] = rows
      .filter(r => r.ticker && r.quantity && r.totalAmount)
      .map(r => {
        const qty = parseFloat(r.quantity);
        const total = parseFloat(r.totalAmount);
        return {
          id: uuidv4(),
          date: r.date,
          type: r.type as 'BUY' | 'SELL',
          ticker: r.ticker.toUpperCase(),
          assetType: r.assetType as 'CEDEAR' | 'ACCION_LOCAL',
          quantity: qty,
          pricePerUnit: qty > 0 ? total / qty : 0,
          currency: r.currency as 'ARS' | 'USD',
          totalAmount: total,
          exchangeRate: r.exchangeRate ? parseFloat(r.exchangeRate) : undefined,
          notes: r.notes || undefined,
        };
      });
    if (txs.length === 0) return;
    onImport(txs);
  };

  const tabCls = (m: typeof mode) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
      mode === m ? 'bg-blue-600 text-white' : 'bg-[#0f1117] border border-[#2d3348] text-slate-400 hover:text-white'
    }`;

  const inputCls = "bg-[#0f1117] border border-[#2d3348] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500";
  const selectCls = `${inputCls} cursor-pointer`;

  const switchMode = (m: typeof mode) => { resetFileState(); setMode(m); };

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => switchMode('csv')} className={tabCls('csv')}>
          <Upload size={14} /> Importar CSV
        </button>
        <button onClick={() => switchMode('json')} className={tabCls('json')}>
          <FileJson size={14} /> Importar JSON
        </button>
        <button onClick={() => switchMode('table')} className={tabCls('table')}>
          <FileText size={14} /> Tabla editable
        </button>
      </div>

      {/* CSV mode */}
      {mode === 'csv' && (
        <div className="space-y-4">
          <div className="bg-[#0f1117] rounded-lg p-4 border border-[#2d3348] text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-2">Formato esperado del CSV:</p>
            <code className="text-green-400">fecha, tipo, ticker, tipo_activo, cantidad, monto_total, moneda, tipo_cambio, notas</code>
            <p className="mt-2">Ejemplo: <code className="text-slate-300">2024-01-15, BUY, AAPL, CEDEAR, 10, 45000, ARS, 1200, Primera compra</code></p>
          </div>

          <div
            className="border-2 border-dashed border-[#2d3348] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm">Haz clic para seleccionar un archivo CSV</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </div>

          {fileError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} /> {fileError}
            </div>
          )}
          {fileSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-3 text-sm">
              <CheckCircle size={16} /> {fileSuccess}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d3348] text-slate-300 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            {fileSuccess && (
              <button onClick={handleFileImport} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Importar
              </button>
            )}
          </div>
        </div>
      )}

      {/* JSON mode */}
      {mode === 'json' && (
        <div className="space-y-4">
          <div className="bg-[#0f1117] rounded-lg p-4 border border-[#2d3348] text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-2">Formato esperado:</p>
            <p>Archivo JSON exportado desde <span className="text-slate-300">Configuración → Exportar a JSON</span>, o un array con los campos:</p>
            <code className="text-green-400 block mt-1">{"[{ date, type, ticker, assetType, quantity, totalAmount, currency, exchangeRate?, notes? }]"}</code>
          </div>

          <div
            className="border-2 border-dashed border-[#2d3348] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileJson size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm">Haz clic para seleccionar un archivo JSON</p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
          </div>

          {fileError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} /> {fileError}
            </div>
          )}
          {fileSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-3 text-sm">
              <CheckCircle size={16} /> {fileSuccess}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d3348] text-slate-300 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            {fileSuccess && (
              <button onClick={handleFileImport} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Importar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table mode */}
      {mode === 'table' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#2d3348]">
                  <th className="text-left pb-2 pr-2">Fecha</th>
                  <th className="text-left pb-2 pr-2">Tipo</th>
                  <th className="text-left pb-2 pr-2">Ticker</th>
                  <th className="text-left pb-2 pr-2">Activo</th>
                  <th className="text-left pb-2 pr-2">Cantidad</th>
                  <th className="text-left pb-2 pr-2">Monto Total</th>
                  <th className="text-left pb-2 pr-2">Moneda</th>
                  <th className="text-left pb-2 pr-2">T/C</th>
                  <th className="text-left pb-2 pr-2">Precio Unit. (calc.)</th>
                  <th className="text-left pb-2 pr-2">Notas</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {rows.map((row, i) => {
                  const qty = parseFloat(row.quantity || '0');
                  const total = parseFloat(row.totalAmount || '0');
                  const calcPrice = qty > 0 && total > 0 ? (total / qty).toFixed(2) : '—';
                  return (
                    <tr key={i} className="border-b border-[#2d3348]/50">
                      <td className="py-1 pr-2">
                        <input type="date" value={row.date} onChange={e => updateRow(i, 'date', e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }} />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={row.type} onChange={e => updateRow(i, 'type', e.target.value)} className={selectCls}>
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <input type="text" value={row.ticker} onChange={e => updateRow(i, 'ticker', e.target.value.toUpperCase())} placeholder="AAPL" className={`${inputCls} w-20`} />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={row.assetType} onChange={e => updateRow(i, 'assetType', e.target.value)} className={selectCls}>
                          <option value="CEDEAR">CEDEAR</option>
                          <option value="ACCION_LOCAL">Local</option>
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <input type="number" value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} placeholder="0" className={`${inputCls} w-20`} />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="number" value={row.totalAmount} onChange={e => updateRow(i, 'totalAmount', e.target.value)} placeholder="0.00" className={`${inputCls} w-24`} />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={row.currency} onChange={e => updateRow(i, 'currency', e.target.value)} className={selectCls}>
                          <option value="ARS">ARS</option>
                          <option value="USD">USD</option>
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <input type="number" value={row.exchangeRate} onChange={e => updateRow(i, 'exchangeRate', e.target.value)} placeholder="—" className={`${inputCls} w-20`} />
                      </td>
                      <td className="py-1 pr-2 text-slate-500 font-mono w-24">{calcPrice}</td>
                      <td className="py-1 pr-2">
                        <input type="text" value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} placeholder="—" className={`${inputCls} w-28`} />
                      </td>
                      <td className="py-1">
                        <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 transition-colors px-1">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button onClick={addRow} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            + Agregar fila
          </button>

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d3348] text-slate-300 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleTableImport}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Importar {rows.filter(r => r.ticker && r.quantity && r.totalAmount).length} operaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
