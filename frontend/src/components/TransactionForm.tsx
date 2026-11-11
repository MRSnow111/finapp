import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import type { Category, Transaction, TransactionType } from '../types';
import { parseMoneyToMinor } from '../utils/format';
import { Button, Input, Label, Modal, Select } from './ui';
import { Alert } from './Alert';

export function TransactionForm({
  open,
  categories,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  categories: Category[];
  initial?: Transaction | null;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    amount_minor: number;
    category_id: number | null;
    date: string;
    note: string | null;
  }) => Promise<void>;
}) {
  const editing = initial !== null && initial !== undefined;
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(
    initial ? (Math.abs(initial.amount_minor) / 100).toString().replace('.', ',') : '',
  );
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id?.toString() ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Категории, подходящие под выбранный тип операции
  const suitable = categories.filter((c) => c.type === type || c.type === 'BOTH');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const minor = parseMoneyToMinor(amount);
    if (minor === null || minor <= 0) {
      setError('Введите сумму больше нуля, например 1 250,50');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        type,
        amount_minor: minor,
        category_id: categoryId ? Number(categoryId) : null,
        date,
        note: note.trim() || null,
      });
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось сохранить операцию');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={editing ? 'Изменить операцию' : 'Новая операция'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Alert message={error ?? ''} />

        {/* Тип: переключатель с бегущей подсветкой */}
        <div className="relative grid grid-cols-2 gap-1 rounded-xl border border-pine bg-deep/60 p-1">
          {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="tx-type-pill"
                    className={`absolute inset-0 rounded-lg ${
                      t === 'EXPENSE'
                        ? 'bg-gradient-to-br from-expense to-expense2'
                        : 'bg-gradient-to-br from-income to-accent2'
                    }`}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span className={`relative ${active ? 'text-deep' : 'text-sage'}`}>
                  {t === 'EXPENSE' ? 'Расход' : 'Доход'}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <Label>Сумма</Label>
          <Input
            inputMode="decimal"
            placeholder="1 250,50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
            className="text-lg font-semibold"
          />
        </div>
        <div>
          <Label>Категория</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Без категории</option>
            {suitable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Дата</Label>
          <Input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Заметка</Label>
          <Input
            placeholder="Например: продукты на неделю"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
