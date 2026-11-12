import { useEffect, useMemo, useState } from 'react';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactions';
import { listCategories } from '../services/categories';
import type { Category, Transaction } from '../types';
import { formatMoney, formatDateShort } from '../utils/format';
import { Alert } from '../components/Alert';
import { TransactionForm } from '../components/TransactionForm';
import { Button, Card, ConfirmDialog, Input, Select } from '../components/ui';

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [search, setSearch] = useState('');

  // Форма
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Удаление
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    Promise.all([listTransactions(), listCategories()])
      .then(([txs, cats]) => {
        setTransactions(txs);
        setCategories(cats);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => filterType === 'ALL' || t.type === filterType)
      .filter((t) => filterCategory === 'ALL' || t.category_id === Number(filterCategory))
      .filter((t) => !filterFrom || t.date >= filterFrom)
      .filter((t) => !filterTo || t.date <= filterTo)
      .filter((t) => !search || (t.note ?? '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  }, [transactions, filterType, filterCategory, filterFrom, filterTo, search]);

  const filteredSum = useMemo(
    () =>
      filtered.reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount_minor : -t.amount_minor), 0),
    [filtered],
  );

  async function handleSave(data: Omit<Transaction, 'id' | 'created_at'>) {
    if (editing) {
      const updated = await updateTransaction(editing.id, data);
      setTransactions((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
    } else {
      const created = await createTransaction(data);
      setTransactions((prev) => [created, ...prev]);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteTransaction(deleting.id);
      setTransactions((prev) => prev.filter((t) => t.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError('Не удалось удалить операцию');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sage">Загрузка…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-mint">История</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Операция</Button>
      </div>

      <Alert message={error ?? ''} />

      {/* Фильтры */}
      <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="ALL">Все типы</option>
          <option value="EXPENSE">Расходы</option>
          <option value="INCOME">Доходы</option>
        </Select>
        <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="ALL">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="С даты" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="По дату" />
        <Input
          placeholder="Поиск по заметке…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 md:col-span-4"
        />
      </Card>

      {/* Итог по выборке */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-sage">
            Найдено операций: <span className="font-semibold text-mint">{filtered.length}</span>
          </span>
          <span className={`font-semibold tabular-nums ${filteredSum >= 0 ? 'text-income' : 'text-expense'}`}>
            {filteredSum >= 0 ? '+' : '−'}{formatMoney(Math.abs(filteredSum))}
          </span>
        </div>
      )}

      {/* Список */}
      {filtered.length === 0 ? (
        <Card className="text-center text-sage">
          {transactions.length === 0
            ? 'Пока нет операций. Добавьте первую — кнопка «+ Операция».'
            : 'Ничего не найдено по фильтрам.'}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
            const income = t.type === 'INCOME';
            return (
              <Card key={t.id} className="flex items-center justify-between !p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: cat?.color ?? '#8EB69B', color: cat?.color ?? '#8EB69B' }}
                    />
                    <span className="truncate font-medium text-mint">
                      {cat?.name ?? 'Без категории'}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate pl-5 text-xs text-sage/80">
                    {formatDateShort(t.date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 pl-2">
                  <span className={`whitespace-nowrap font-semibold tabular-nums ${income ? 'text-income' : 'text-expense'}`}>
                    {income ? '+' : '−'}{formatMoney(t.amount_minor)}
                  </span>
                  <button
                    onClick={() => { setEditing(t); setFormOpen(true); }}
                    className="rounded-lg px-2 py-1 text-sm text-sage/60 transition-colors hover:bg-moss hover:text-mint"
                    title="Редактировать"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => setDeleting(t)}
                    className="rounded-lg px-2 py-1 text-sm text-sage/60 transition-colors hover:bg-expense/10 hover:text-expense"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        categories={categories}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить операцию?"
        message={
          deleting
            ? `${deleting.type === 'INCOME' ? 'Доход' : 'Расход'} на ${formatMoney(deleting.amount_minor)} будет удалён безвозвратно.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deleteBusy}
      />
    </div>
  );
}
