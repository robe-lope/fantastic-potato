import { useState, useCallback } from 'react';
import type { Transaction } from '../types';
import { loadTransactions, saveTransactions, addTransaction, updateTransaction, deleteTransaction } from '../data/store';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());

  const add = useCallback((transaction: Transaction) => {
    const updated = addTransaction(transaction);
    setTransactions(updated);
  }, []);

  const update = useCallback((transaction: Transaction) => {
    const updated = updateTransaction(transaction);
    setTransactions(updated);
  }, []);

  const remove = useCallback((id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
  }, []);

  const importTransactions = useCallback((imported: Transaction[], replace = false) => {
    const current = replace ? [] : loadTransactions();
    const merged = [...current, ...imported];
    saveTransactions(merged);
    setTransactions(merged);
  }, []);

  const replaceAll = useCallback((newTransactions: Transaction[]) => {
    saveTransactions(newTransactions);
    setTransactions(newTransactions);
  }, []);

  return { transactions, add, update, remove, importTransactions, replaceAll };
}
