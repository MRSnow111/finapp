import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactions';
import { listCategories } from '../services/categories';
import type { Category, Transaction } from '../types';
import { formatMoney, formatDateShort } from '../utils/format';
import { currentYM, shiftYM, formatYM, formatYMPrepositional, transactionsInMonth, sumType } from '../utils/months';
import { Alert } from '../components/Alert';
import { TransactionForm } from '../components/TransactionForm';
import { Button, Card, ConfirmDialog } from '../components/ui';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ym, setYm] = useState<[number, number]>(currentYM());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
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

  const monthTxs = useMemo(() => transactionsInMonth(transactions, ym), [transactions, ym]);
  const income = useMemo(() => sumType(monthTxs, 'INCOME'), [monthTxs]);
  const expense = useMemo(() => sumType(monthTxs, 'EXPENSE'), [monthTxs]);
  const total = income - expense;

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const recent = useMemo(
    () => [...monthTxs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id)).slice(0, 5),
    [monthTxs],
  );

  const now = currentYM();
  const isCurrent = ym[0] === now[0] && ym[1] === now[1];

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
        <h1 className="text-2xl font-bold tracking-tight text-mint">Главная</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Операция</Button>
      </div>

      <Alert message={error ?? ''} />

      {/* Переключение месяцев */}
      <div className="flex items-center justify-between rounded-2xl border border-pine/60 bg-forest/60 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setYm(shiftYM(ym, -1))}
          className="grid h-9 w-9 place-items-center rounded-xl text-sage transition-colors hover:bg-moss hover:text-mint"
          title="Предыдущий месяц"
        >
          ←
        </button>
        <span className="font-semibold text-mint">{formatYM(ym)}</span>
        <button
          onClick={() => setYm(shiftYM(ym, 1))}
          disabled={isCurrent}
          className="grid h-9 w-9 place-items-center rounded-xl text-sage transition-colors hover:bg-moss hover:text-mint disabled:pointer-events-none disabled:opacity-30"
          title="Следующий месяц"
        >
          →
        </button>
      </div>

      {/* Баланс */}
      <motion.div
        key={`${ym[0]}-${ym[1]}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl border border-sage/20 bg-gradient-to-br from-pine via-moss to-forest p-6 shadow-2xl shadow-black/40"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sage/20 blur-3xl" />
        <div className="relative text-center">
          <div className="text-sm text-sage">Итого {formatYMPrepositional(ym)}</div>
          <div
            className={`mt-1 text-4xl font-black tabular-nums sm:text-5xl ${
              total >= 0 ? 'text-mint' : 'text-expense'
            }`}
          >
            {formatMoney(total)}
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-deep/40 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-sage">Доходы</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-income">+{formatMoney(income)}</div>
          </div>
          <div className="rounded-2xl bg-deep/40 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-sage">Расходы</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-expense">{formatMoney(expense)}</div>
          </div>
        </div>
      </motion.div>

      {/* Последние операции */}
      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sage">Последние операции</h2>
        <Link to="/history" className="text-sm font-medium text-accent transition-colors hover:text-mint">
          Вся история →
        </Link>
      </div>
      {recent.length === 0 ? (
        <Card className="text-center text-sage">
          {transactions.length === 0
            ? 'Пока нет операций. Добавьте первую.'
            : `Операций ${formatYMPrepositional(ym)} не было.`}
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((t) => {
            const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
            const incomeT = t.type === 'INCOME';
            return (
              <Card key={t.id} className="flex items-center justify-between !p-3">
                <button
                  onClick={() => { setEditing(t); setFormOpen(true); }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: cat?.color ?? '#8EB69B', color: cat?.color ?? '#8EB69B' }}
                    />
                    <span className="truncate font-medium text-mint">{cat?.name ?? 'Без категории'}</span>
                  </div>
                  <div className="mt-0.5 pl-5 text-xs text-sage/80">
                    {formatDateShort(t.date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1 pl-2">
                  <span className={`whitespace-nowrap font-semibold tabular-nums ${incomeT ? 'text-income' : 'text-expense'}`}>
                    {incomeT ? '+' : '−'}{formatMoney(t.amount_minor)}
                  </span>
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
