import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from '../types';

interface CSVRow {
  fecha?: string;
  tipo?: string;
  ticker?: string;
  tipo_activo?: string;
  cantidad?: string;
  precio_unitario?: string;
  moneda?: string;
  tipo_cambio?: string;
  notas?: string;
}

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data.map((row) => {
            const qty = parseFloat(row.cantidad || '0');
            const price = parseFloat(row.precio_unitario || '0');
            const type = (row.tipo || '').toUpperCase() as 'BUY' | 'SELL';
            const currency = (row.moneda || 'ARS').toUpperCase() as 'ARS' | 'USD';
            const assetType = (row.tipo_activo || 'CEDEAR').toUpperCase().replace(' ', '_') as 'CEDEAR' | 'ACCION_LOCAL';
            const exchangeRate = row.tipo_cambio ? parseFloat(row.tipo_cambio) : undefined;

            return {
              id: uuidv4(),
              date: row.fecha || '',
              type,
              ticker: (row.ticker || '').toUpperCase(),
              assetType,
              quantity: qty,
              pricePerUnit: price,
              currency,
              totalAmount: qty * price,
              exchangeRate: exchangeRate && !isNaN(exchangeRate) ? exchangeRate : undefined,
              notes: row.notas || undefined,
            } as Transaction;
          });
          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: reject,
    });
  });
}

export function exportToCSV(transactions: Transaction[]): string {
  const rows = transactions.map(t => ({
    fecha: t.date,
    tipo: t.type,
    ticker: t.ticker,
    tipo_activo: t.assetType,
    cantidad: t.quantity,
    precio_unitario: t.pricePerUnit,
    moneda: t.currency,
    tipo_cambio: t.exchangeRate || '',
    monto_total: t.totalAmount,
    notas: t.notes || '',
  }));
  return Papa.unparse(rows);
}
