import type { Transaction } from '../types';
import { sampleTransactions } from './sampleData';

const STORAGE_KEY = 'portfolio_transactions';

export function loadTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Primera vez: cargar datos de ejemplo
    saveTransactions(sampleTransactions);
    return sampleTransactions;
  }
  try {
    return JSON.parse(data) as Transaction[];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Transaction): Transaction[] {
  const current = loadTransactions();
  const updated = [...current, transaction];
  saveTransactions(updated);
  return updated;
}

export function updateTransaction(updated: Transaction): Transaction[] {
  const current = loadTransactions();
  const transactions = current.map(t => t.id === updated.id ? updated : t);
  saveTransactions(transactions);
  return transactions;
}

export function deleteTransaction(id: string): Transaction[] {
  const current = loadTransactions();
  const transactions = current.filter(t => t.id !== id);
  saveTransactions(transactions);
  return transactions;
}

export function clearAllTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
