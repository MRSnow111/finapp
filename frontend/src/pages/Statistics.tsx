import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { listTransactions } from '../services/transactions';
import { listCategories } from '../services/categories';
import type { Category, Transaction } from '../types';
import { formatMoney } from '../utils/format';
import { currentYM, lastMonths, shiftYM, formatYM, formatYMPrepositional, transactionsInMonth, sumType } from '../utils/months';
import { Alert } from '../components/Alert';
import { Card } from '../components/ui';

const FALLBACK_COLORS = ['#8EB69B', '#6FAFA4', '#7FA6D0', '#9AA8E0', '#7C9A8B', '#D9B26A', '#E08A78', '#B8DCC3', '#8EE3A6'];

const axisColor = 'rgb(var(--c-sage))';
const gridColor = 'rgb(var(--c-pine) / 0.28)';

export default function Statistics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ym, setYm] = useState<[number, number]>(currentYM());

  useEffect(() => {
    Promise.all([listTransactions(), listCategories()])
      .then(([txs, cats]) => {
        setTransactions(txs);
        setCategories(cats);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Круговая диаграмма: расходы по категориям за выбранный месяц
  const monthTxs = useMemo(() => transactionsInMonth(transactions, ym), [transactions, ym]);
  const expenseTotal = useMemo(() => sumType(monthTxs, 'EXPENSE'), [monthTxs]);

  const pieData = useMemo(() => {
    const byCategory = new Map<number, number>();
    for (const t of monthTxs) {
      if (t.type !== 'EXPENSE') continue;
      const key = t.category_id ?? 0;
      byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount_minor);
    }
    return [...byCategory.entries()]
      .map(([id, amount], i) => ({
        name: categoryById.get(id)?.name ?? 'Без категории',
        value: amount / 100,
        color: categoryById.get(id)?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxs, categoryById]);

  // Столбцы: доходы и расходы по месяцам (последние 6)
  const months = useMemo(() => lastMonths(6, ym), [ym]);

  const barData = useMemo(() => {
    return months.map((m) => {
      const txs = transactionsInMonth(transactions, m);
      return {
        month: formatYM(m).split(' ')[0].slice(0, 3).toLowerCase(),
        Доходы: Math.round(sumType(txs, 'INCOME') / 100),
        Расходы: Math.round(sumType(txs, 'EXPENSE') / 100),
        tooltipTitle: formatYM(m),
      };
    });
  }, [months, transactions]);

  const now = currentYM();
  const isCurrent = ym[0] === now[0] && ym[1] === now[1];

  if (loading) {
    return <div className="py-20 text-center text-sage">Загрузка…</div>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-mint">Статистика</h1>

      <Alert message={error ?? ''} />

      {/* Переключение месяцев */}
      <div className="flex items-center justify-between rounded-2xl border border-pine/60 bg-forest/60 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setYm(shiftYM(ym, -1))}
          className="grid h-9 w-9 place-items-center rounded-xl text-sage transition-colors hover:bg-moss hover:text-mint"
        >
          ←
        </button>
        <span className="font-semibold text-mint">{formatYM(ym)}</span>
        <button
          onClick={() => setYm(shiftYM(ym, 1))}
          disabled={isCurrent}
          className="grid h-9 w-9 place-items-center rounded-xl text-sage transition-colors hover:bg-moss hover:text-mint disabled:pointer-events-none disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Круговая: расходы по категориям */}
      <Card>
        <h2 className="mb-4 font-semibold text-mint">
          Расходы по категориям {formatYMPrepositional(ym)}
        </h2>
        {pieData.length === 0 ? (
          <div className="py-10 text-center text-sage">
            {expenseTotal === 0 ? 'Расходов за этот месяц нет.' : ''}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="h-72"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="82%"
                    paddingAngle={3}
                    stroke="rgb(var(--c-forest))"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: 'rgb(var(--c-mint))' }}
                    formatter={(value) => formatMoney(Math.round(Number(value ?? 0) * 100)) as unknown as string}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: axisColor }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="text-center text-sm text-sage">
              Всего расходов: <span className="font-semibold text-expense">{formatMoney(expenseTotal)}</span>
            </div>
          </>
        )}
      </Card>

      {/* Столбцы: по месяцам */}
      <Card>
        <h2 className="mb-4 font-semibold text-mint">Доходы и расходы по месяцам</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: axisColor }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: axisColor }}
                tickFormatter={(v: number) => fmtCompact(v)}
                width={52}
              />
              <Tooltip
                cursor={{ fill: 'rgb(var(--c-pine) / 0.12)' }}
                contentStyle={tooltipStyle}
                itemStyle={{ color: 'rgb(var(--c-mint))' }}
                formatter={(value, name) => [
                  formatMoney(Math.round(Number(value ?? 0) * 100)) as unknown as string,
                  String(name ?? ''),
                ]}
                labelFormatter={(label) => {
                  const item = barData.find((d) => d.month === label);
                  return item ? item.tooltipTitle : String(label);
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: axisColor }} />
              <Bar dataKey="Доходы" fill="rgb(var(--c-income))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Расходы" fill="rgb(var(--c-expense))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: 'rgb(var(--c-forest))',
  border: '1px solid rgb(var(--c-pine))',
  borderRadius: 12,
  color: 'rgb(var(--c-mint))',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
};

/** Компактный формат оси: 12 000 -> 12 тыс. */
function fmtCompact(v: number): string {
  if (v >= 1000) return `${(v / 1000).toLocaleString('ru-RU')} тыс.`;
  return v.toLocaleString('ru-RU');
}
