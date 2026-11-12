import { api } from './api';
import type { Transaction } from '../types';

export async function listTransactions(): Promise<Transaction[]> {
  const res = await api.get<Transaction[]>('/transactions/');
  return res.data;
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'created_at'>,
): Promise<Transaction> {
  const res = await api.post<Transaction>('/transactions/', data);
  return res.data;
}

export async function updateTransaction(
  id: number,
  data: Partial<Transaction>,
): Promise<Transaction> {
  const res = await api.put<Transaction>(`/transactions/${id}`, data);
  return res.data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/transactions/${id}`);
}
