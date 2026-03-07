'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Wand2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { todayISO } from '@/lib/formatters';
import { validateSell } from '@/lib/calculations';
import { toYahooTicker } from '@/lib/yahooTickers';

interface TransactionFormProps {
  onSubmit: (tx: Transaction) => void;
  initial?: Transaction;
  transactions: Transaction[];
  onCancel?: () => void;
}

type InputMode = 'manual' | 'auto';

const emptyForm = {
  date: todayISO(),
  type: 'BUY' as 'BUY' | 'SELL',
  ticker: '',
  assetType: 'CEDEAR' as 'CEDEAR' | 'ACCION_LOCAL',
  quantity: '',
  totalAmount: '',
  currency: 'USD' as 'ARS' | 'USD',
  exchangeRate: '',
  notes: '',
};

export function TransactionForm({ onSubmit, initial, transactions, onCancel }: TransactionFormProps) {
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchedPriceInfo, setFetchedPriceInfo] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        date: initial.date,
        type: initial.type,
        ticker: initial.ticker,
        assetType: initial.assetType,
        quantity: String(initial.quantity),
        totalAmount: String(initial.totalAmount),
        currency: initial.currency,
        exchangeRate: initial.exchangeRate ? String(initial.exchangeRate) : '',
        notes: initial.notes || '',
      });
    }
  }, [initial]);

  // Auto-fetch price when mode is 'auto' and ticker + date + qty are filled
  useEffect(() => {
    if (inputMode !== 'auto' || !form.ticker || !form.date || !form.quantity) return;
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) return;

    const timer = setTimeout(async () => {
      setIsFetchingPrice(true);
      setFetchedPriceInfo(null);
      try {
        const yahooSymbol = toYahooTicker(form.ticker.toUpperCase());
        const res = await fetch(`/api/prices/historical?symbol=${yahooSymbol}&date=${form.date}`);
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        const total = data.price * qty;
        setForm(prev => ({ ...prev, totalAmount: String(total.toFixed(2)) }));
        setFetchedPriceInfo(`Precio de Yahoo Finance (${data.date ? new Date(data.date).toLocaleDateString('es-AR') : form.date}): ${form.currency === 'ARS' ? '$ ' : 'US$ '}${data.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
      } catch {
        setFetchedPriceInfo('No se encontró precio para esa fecha. Podés ingresarlo manualmente.');
        set('totalAmount', '');
      } finally {
        setIsFetchingPrice(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, form.ticker, form.date, form.quantity, form.assetType, form.currency]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const today = todayISO();

    if (!form.date) errs.date = 'La fecha es requerida';
    else if (form.date > today) errs.date = 'La fecha no puede ser futura';

    if (!form.ticker) errs.ticker = 'El ticker es requerido';
    else if (!/^[a-zA-Z0-9]+$/.test(form.ticker)) errs.ticker = 'El ticker debe ser alfanumérico';

    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) errs.quantity = 'La cantidad debe ser mayor a 0';

    const total = parseFloat(form.totalAmount);
    if (!form.totalAmount || isNaN(total) || total <= 0) errs.totalAmount = 'El monto total debe ser mayor a 0';

    if (form.type === 'SELL') {
      const existingTxs = initial
        ? transactions.filter(t => t.id !== initial.id)
        : transactions;
      const canSell = validateSell(form.ticker.toUpperCase(), qty, existingTxs);
      if (!canSell) errs.quantity = `No tenés suficientes unidades de ${form.ticker.toUpperCase()} para vender`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = parseFloat(form.quantity);
    const total = parseFloat(form.totalAmount);
    const tx: Transaction = {
      id: initial?.id || uuidv4(),
      date: form.date,
      type: form.type,
      ticker: form.ticker.toUpperCase(),
      assetType: form.assetType,
      quantity: qty,
      pricePerUnit: qty > 0 ? total / qty : 0,
      currency: form.currency,
      totalAmount: total,
      exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : undefined,
      notes: form.notes || undefined,
    };
    onSubmit(tx);
    if (!initial) {
      setForm({ ...emptyForm, date: todayISO() });
      setFetchedPriceInfo(null);
    }
  };

  const set = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const inputClass = (field: string) =>
    `w-full bg-[#0f1117] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-500 focus:ring-red-500/30'
        : 'border-[#2d3348] focus:ring-blue-500/30 focus:border-blue-500'
    }`;

  const qty = parseFloat(form.quantity || '0');
  const total = parseFloat(form.totalAmount || '0');
  const calculatedPrice = qty > 0 && total > 0 ? total / qty : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Input mode toggle */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-2">Modo de carga</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setInputMode('manual'); setFetchedPriceInfo(null); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              inputMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f1117] border border-[#2d3348] text-slate-400 hover:text-white'
            }`}
          >
            Monto total manual
          </button>
          <button
            type="button"
            onClick={() => { setInputMode('auto'); set('totalAmount', ''); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              inputMode === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f1117] border border-[#2d3348] text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 size={12} /> Buscar precio por fecha
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de Operación</label>
          <div className="flex rounded-lg overflow-hidden border border-[#2d3348]">
            <button
              type="button"
              onClick={() => set('type', 'BUY')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                form.type === 'BUY'
                  ? 'bg-green-600 text-white'
                  : 'bg-[#0f1117] text-slate-400 hover:text-white'
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => set('type', 'SELL')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                form.type === 'SELL'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#0f1117] text-slate-400 hover:text-white'
              }`}
            >
              Venta
            </button>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Fecha</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            max={todayISO()}
            className={inputClass('date')}
            style={{ colorScheme: 'dark' }}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ticker */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Ticker</label>
          <input
            type="text"
            value={form.ticker}
            onChange={e => set('ticker', e.target.value.toUpperCase())}
            placeholder="Ej: AAPL, MELI, GGAL"
            className={inputClass('ticker')}
          />
          {errors.ticker && <p className="text-red-400 text-xs mt-1">{errors.ticker}</p>}
        </div>

        {/* Tipo activo */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de Activo</label>
          <select
            value={form.assetType}
            onChange={e => set('assetType', e.target.value)}
            className={inputClass('assetType')}
          >
            <option value="CEDEAR">CEDEAR</option>
            <option value="ACCION_LOCAL">Acción Local</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Cantidad */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad</label>
          <input
            type="number"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            placeholder="0"
            min="0.001"
            step="any"
            className={inputClass('quantity')}
          />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
        </div>

        {/* Monto total */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Monto total
            {inputMode === 'auto' && isFetchingPrice && (
              <Loader2 size={10} className="inline ml-1 animate-spin text-blue-400" />
            )}
          </label>
          <input
            type="number"
            value={form.totalAmount}
            onChange={e => set('totalAmount', e.target.value)}
            placeholder="0.00"
            min="0.001"
            step="any"
            disabled={inputMode === 'auto' && isFetchingPrice}
            className={`${inputClass('totalAmount')} ${inputMode === 'auto' ? 'border-blue-500/50' : ''}`}
          />
          {errors.totalAmount && <p className="text-red-400 text-xs mt-1">{errors.totalAmount}</p>}
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Moneda</label>
          <select
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            className={inputClass('currency')}
          >
            <option value="ARS">ARS (Pesos)</option>
            <option value="USD">USD (Dólares)</option>
          </select>
        </div>
      </div>

      {/* Precio calculado */}
      {calculatedPrice !== null && (
        <div className="bg-[#0f1117] rounded-lg px-4 py-3 border border-[#2d3348]">
          <span className="text-slate-400 text-sm">Precio por unidad: </span>
          <span className="text-white font-mono font-semibold text-sm">
            {form.currency === 'ARS' ? '$ ' : 'US$ '}
            {calculatedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Yahoo Finance info */}
      {fetchedPriceInfo && (
        <div className={`text-xs px-4 py-2 rounded-lg border ${
          fetchedPriceInfo.includes('No se encontró')
            ? 'bg-yellow-900/10 border-yellow-700/40 text-yellow-400'
            : 'bg-blue-900/10 border-blue-700/40 text-blue-400'
        }`}>
          {fetchedPriceInfo}
        </div>
      )}

      {/* Tipo de cambio */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Tipo de cambio ARS/USD <span className="text-slate-600">(opcional)</span>
        </label>
        <input
          type="number"
          value={form.exchangeRate}
          onChange={e => set('exchangeRate', e.target.value)}
          placeholder="Ej: 1200"
          min="0"
          step="any"
          className={inputClass('exchangeRate')}
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Notas <span className="text-slate-600">(opcional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Observaciones sobre la operación..."
          rows={2}
          className={`${inputClass('notes')} resize-none`}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d3348] text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            form.type === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {initial ? 'Guardar cambios' : form.type === 'BUY' ? 'Registrar compra' : 'Registrar venta'}
        </button>
      </div>
    </form>
  );
}
