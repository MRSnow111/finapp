export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: number;
  name: string;
  /** INCOME | EXPENSE | BOTH */
  type: string;
  color: string;
  icon: string | null;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  /** Сумма в копейках */
  amount_minor: number;
  category_id: number | null;
  /** YYYY-MM-DD */
  date: string;
  note: string | null;
  created_at: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active: boolean;
}
