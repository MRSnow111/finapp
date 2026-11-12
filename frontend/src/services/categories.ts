import { api } from './api';
import type { Category } from '../types';

export async function listCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>('/categories/');
  return res.data;
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<Category> {
  const res = await api.post<Category>('/categories/', data);
  return res.data;
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const res = await api.put<Category>(`/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
