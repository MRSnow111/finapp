import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { type Category, type Tx, dayLabel, money, monthLabel, shiftMonth } from './mock'

export const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-800/80 dark:text-white'

export const btnPrimary =
  'rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'

export const surface =
  'rounded-3xl bg-white/80 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur dark:bg-slate-900/70 dark:ring-white/10'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${surface} p-5 ${className}`}>{children}</div>
}

export function Page({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}

export function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-white/80">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export function MonthSwitch({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  return (
    <div className={`inline-flex items-center gap-1 p-1 ${surface}`}>
      <button
        aria-label="Предыдущий месяц"
        onClick={() => setMonth(shiftMonth(month, -1))}
        className="rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-44 text-center font-medium">{monthLabel(month)}</span>
      <button
        aria-label="Следующий месяц"
        onClick={() => setMonth(shiftMonth(month, 1))}
        className="rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

export function TxList({
  txs,
  cats,
  onDelete,
  empty,
}: {
  txs: Tx[]
  cats: Category[]
  onDelete?: (id: string) => void
  empty: string
}) {
  if (txs.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">{empty}</p>
      </Card>
    )
  }
  return (
    <div className="space-y-2">
      {txs.map((t, i) => {
        const c = cats.find((x) => x.id === t.categoryId)
        const income = t.type === 'INCOME'
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.03 }}
            className={`flex items-center gap-4 rounded-2xl p-4 ${surface}`}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: c?.color ?? '#94a3b8' }}
            >
              {(c?.name ?? '?').charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.note || c?.name || 'Без названия'}</p>
              <p className="truncate text-xs text-slate-500">
                {c?.name ?? 'Без категории'} · {dayLabel(t.date)}
              </p>
            </div>
            <span className={`whitespace-nowrap font-semibold tabular-nums ${income ? 'text-emerald-500' : 'text-rose-500'}`}>
              {income ? '+' : '−'}
              {money(t.amountMinor)}
            </span>
            {onDelete && (
              <button
                aria-label="Удалить операцию"
                onClick={() => onDelete(t.id)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                <Trash2 size={16} />
              </button>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
