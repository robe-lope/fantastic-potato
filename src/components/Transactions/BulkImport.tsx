import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { Transaction } from '../../types';
import { parseCSV } from '../../utils/csvParser';
import { v4 as uuidv4 } from 'uuid';
import { todayISO } from '../../utils/formatters';

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
  pricePerUnit: string;
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
  pricePerUnit: '',
  currency: 'ARS',
  exchangeRate: '',
  notes: '',
});

export function BulkImport({ onImport, onCancel }: BulkImportProps) {
  const [mode, setMode] = useState<'csv' | 'table'>('csv');
  const [rows, setRows] = useState<TableRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvSuccess(null);
    try {
      const txs = await parseCSV(file);
      if (txs.length === 0) {
        setCsvError('El archivo no contiene operaciones válidas');
        return;
      }
      setCsvSuccess(`${txs.length} operaciones encontradas. Haz clic en "Importar" para confirmar.`);
      (fileRef.current as HTMLInputElement & { _pending?: Transaction[] })._pending = txs;
    } catch {
      setCsvError('Error al parsear el archivo CSV');
    }
  };

  const handleCSVImport = () => {
    const pending = (fileRef.current as HTMLInputElement & { _pending?: Transaction[] })?._pending;
    if (pending) {
      onImport(pending);
    }
  };

  const updateRow = (i: number, field: keyof TableRow, value: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleTableImport = () => {
    const txs: Transaction[] = rows
      .filter(r => r.ticker && r.quantity && r.pricePerUnit)
      .map(r => {
        const qty = parseFloat(r.quantity);
        const price = parseFloat(r.pricePerUnit);
        return {
          id: uuidv4(),
          date: r.date,
          type: r.type as 'BUY' | 'SELL',
          ticker: r.ticker.toUpperCase(),
          assetType: r.assetType as 'CEDEAR' | 'ACCION_LOCAL',
          quantity: qty,
          pricePerUnit: price,
          currency: r.currency as 'ARS' | 'USD',
          totalAmount: qty * price,
          exchangeRate: r.exchangeRate ? parseFloat(r.exchangeRate) : undefined,
          notes: r.notes || undefined,
        };
      });
    if (txs.length === 0) return;
    onImport(txs);
  };

  const inputCls = "bg-[#0f1117] border border-[#2d3348] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('csv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'csv' ? 'bg-blue-600 text-white' : 'bg-[#0f1117] border border-[#2d3348] text-slate-400 hover:text-white'
          }`}
        >
          <Upload size={14} /> Importar CSV
        </button>
        <button
          onClick={() => setMode('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'table' ? 'bg-blue-600 text-white' : 'bg-[#0f1117] border border-[#2d3348] text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={14} /> Tabla editable
        </button>
      </div>

      {mode === 'csv' && (
        <div className="space-y-4">
          <div className="bg-[#0f1117] rounded-lg p-4 border border-[#2d3348] text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-2">Formato esperado del CSV:</p>
            <code className="text-green-400">fecha, tipo, ticker, tipo_activo, cantidad, precio_unitario, moneda, tipo_cambio, notas</code>
            <p className="mt-2">Ejemplo: <code className="text-slate-300">2024-01-15, BUY, AAPL, CEDEAR, 10, 4500, ARS, 1200, Primera compra</code></p>
          </div>

          <div
            className="border-2 border-dashed border-[#2d3348] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm">Haz clic para seleccionar un archivo CSV</p>
            <p className="text-slate-600 text-xs mt-1">O arrastrá y soltá el archivo aquí</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </div>

          {csvError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} />
              {csvError}
            </div>
          )}
          {csvSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-3 text-sm">
              <CheckCircle size={16} />
              {csvSuccess}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d3348] text-slate-300 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            {csvSuccess && (
              <button onClick={handleCSVImport} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Importar
              </button>
            )}
          </div>
        </div>
      )}

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
                  <th className="text-left pb-2 pr-2">Precio</th>
                  <th className="text-left pb-2 pr-2">Moneda</th>
                  <th className="text-left pb-2 pr-2">T/C</th>
                  <th className="text-left pb-2 pr-2">Notas</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {rows.map((row, i) => (
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
                      <input type="number" value={row.pricePerUnit} onChange={e => updateRow(i, 'pricePerUnit', e.target.value)} placeholder="0.00" className={`${inputCls} w-24`} />
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
                    <td className="py-1 pr-2">
                      <input type="text" value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} placeholder="—" className={`${inputCls} w-28`} />
                    </td>
                    <td className="py-1">
                      <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 transition-colors px-1">×</button>
                    </td>
                  </tr>
                ))}
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
              Importar {rows.filter(r => r.ticker && r.quantity && r.pricePerUnit).length} operaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
