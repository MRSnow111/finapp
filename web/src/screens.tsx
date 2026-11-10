import { useState, type FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Download, LogOut, Moon, Plus, Search, Sun, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  type Category,
  type CatKind,
  PALETTE,
  TODAY,
  type Tx,
  type TxType,
  expenseByCategory,
  monthOf,
  monthlySeries,
  money,
  totals,
} from './mock'
import { Card, MonthSwitch, Page, Stat, TxList, btnPrimary, inputCls } from './ui'

// ───────────── Вход и регистрация ─────────────

export function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'invite'>('login')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onLogin()
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white shadow-xl shadow-indigo-500/40">
            ₽
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Финансы</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Личный учёт доходов и расходов</p>
        </div>

        <Card>
          <div className="mb-5 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['login', 'invite'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'login' ? 'Вход' : 'По приглашению'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'invite' && <input className={inputCls} placeholder="Код приглашения" required />}
            {mode === 'invite' && <input className={inputCls} placeholder="Имя" required />}
            <input className={inputCls} type="email" placeholder="Email" required />
            <input className={inputCls} type="password" placeholder="Пароль" required minLength={10} />
            <button className={`${btnPrimary} mt-2 w-full`}>
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            Макет: данные никуда не отправляются. Регистрация только по приглашению.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

// ───────────── Главная ─────────────

export function HomeScreen({
  txs,
  cats,
  month,
  setMonth,
  onAdd,
}: {
  txs: Tx[]
  cats: Category[]
  month: string
  setMonth: (m: string) => void
  onAdd: () => void
}) {
  const t = totals(txs, month)
  const recent = txs
    .filter((x) => monthOf(x.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <Page title="Главная">
      <div className="mb-5">
        <MonthSwitch month={month} setMonth={setMonth} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-violet-600/30"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/70">Баланс за месяц</p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{money(t.balance)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat icon={TrendingUp} label="Доходы" value={money(t.income)} />
          <Stat icon={TrendingDown} label="Расходы" value={money(t.expense)} />
        </div>
      </motion.div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Последние операции</h2>
      <TxList txs={recent} cats={cats} empty="В этом месяце операций пока нет. Нажмите «+», чтобы добавить." />

      <button
        onClick={onAdd}
        aria-label="Добавить операцию"
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/40 transition hover:scale-105 md:bottom-8 md:right-8"
      >
        <Plus />
      </button>
    </Page>
  )
}

// ───────────── История ─────────────

export function HistoryScreen({
  txs,
  cats,
  onDelete,
}: {
  txs: Tx[]
  cats: Category[]
  onDelete: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<'ALL' | TxType>('ALL')
  const [catId, setCatId] = useState('ALL')

  const list = txs
    .filter(
      (t) =>
        (type === 'ALL' || t.type === type) &&
        (catId === 'ALL' || t.categoryId === catId) &&
        t.note.toLowerCase().includes(q.trim().toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const sum = list.reduce((s, t) => s + (t.type === 'INCOME' ? t.amountMinor : -t.amountMinor), 0)

  return (
    <Page title="История">
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} pl-11`}
            placeholder="Поиск по заметке"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            value={type}
            onChange={(v) => setType(v)}
            options={[
              ['ALL', 'Все'],
              ['INCOME', 'Доходы'],
              ['EXPENSE', 'Расходы'],
            ]}
          />
          <select className={`${inputCls} w-auto py-2 text-sm`} value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="ALL">Все категории</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          Найдено: {list.length}, итог{' '}
          <span className={sum >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{money(sum)}</span>
        </p>
      </div>

      <TxList
        txs={list}
        cats={cats}
        onDelete={(id) => {
          if (window.confirm('Удалить операцию?')) onDelete(id)
        }}
        empty="Ничего не найдено. Попробуйте другой фильтр."
      />
    </Page>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            value === v ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ───────────── Статистика ─────────────

export function StatsScreen({
  txs,
  cats,
  month,
  setMonth,
}: {
  txs: Tx[]
  cats: Category[]
  month: string
  setMonth: (m: string) => void
}) {
  const data = expenseByCategory(txs, cats, month)
  const total = data.reduce((s, d) => s + d.value, 0)
  const series = monthlySeries(txs, month)

  return (
    <Page title="Статистика">
      <div className="mb-5">
        <MonthSwitch month={month} setMonth={setMonth} />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Расходы по категориям</h2>
        {data.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Расходов за этот месяц нет</p>
        ) : (
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
                    {data.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">Всего</span>
                <span className="font-bold tabular-nums">{money(total)}</span>
              </div>
            </div>
            <ul className="space-y-3">
              {data.map((d) => (
                <li key={d.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {Math.round((d.value / total) * 100)}% · {money(d.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-4 font-semibold">Доходы и расходы, 6 месяцев</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.25} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('ru-RU')} ₽`} />
              <Bar dataKey="income" name="Доходы" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Расходы" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  )
}

// ───────────── Категории ─────────────

export function CategoriesScreen({
  cats,
  setCats,
  txs,
}: {
  cats: Category[]
  setCats: (fn: (prev: Category[]) => Category[]) => void
  txs: Tx[]
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CatKind>('EXPENSE')

  const add = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setCats((prev) => [
      ...prev,
      { id: `c${Date.now()}`, name: n, color: PALETTE[prev.length % PALETTE.length], kind },
    ])
    setName('')
  }

  return (
    <Page title="Категории">
      <Card className="mb-4">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
          <input className={inputCls} placeholder="Название категории" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={`${inputCls} sm:w-44`} value={kind} onChange={(e) => setKind(e.target.value as CatKind)}>
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
            <option value="BOTH">Оба</option>
          </select>
          <button className={btnPrimary} disabled={!name.trim()}>
            Добавить
          </button>
        </form>
      </Card>

      <div className="space-y-2">
        {cats.map((c) => {
          const used = txs.some((t) => t.categoryId === c.id)
          return (
            <div key={c.id} className={`flex items-center gap-4 rounded-2xl p-4 ${surfaceClass}`}>
              <span className="h-4 w-4 rounded-full" style={{ background: c.color }} />
              <div className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.kind === 'INCOME' ? 'Доход' : c.kind === 'EXPENSE' ? 'Расход' : 'Доход и расход'}
                  {used ? ' · есть операции' : ''}
                </p>
              </div>
              <button
                disabled={used}
                title={used ? 'Нельзя удалить: есть операции' : 'Удалить категорию'}
                onClick={() => setCats((prev) => prev.filter((x) => x.id !== c.id))}
                className="rounded-xl px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 dark:hover:bg-rose-950/40 dark:disabled:text-slate-600"
              >
                Удалить
              </button>
            </div>
          )
        })}
      </div>
    </Page>
  )
}

const surfaceClass =
  'bg-white/80 shadow-sm ring-1 ring-slate-900/5 backdrop-blur dark:bg-slate-900/70 dark:ring-white/10'

// ───────────── Профиль ─────────────

export function ProfileScreen({
  dark,
  setDark,
  onLogout,
  txs,
  cats,
}: {
  dark: boolean
  setDark: (v: boolean) => void
  onLogout: () => void
  txs: Tx[]
  cats: Category[]
}) {
  const [invite, setInvite] = useState<string | null>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, categories: cats, transactions: txs }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'finapp-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Page title="Профиль">
      <Card className="mb-4 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
          А
        </span>
        <div>
          <p className="font-semibold">Анна Петрова</p>
          <p className="text-sm text-slate-500">anna@example.com · администратор</p>
        </div>
      </Card>

      <Card className="divide-y divide-slate-200/70 p-0 dark:divide-white/10">
        <Row icon={dark ? Sun : Moon} label={dark ? 'Светлая тема' : 'Тёмная тема'} onClick={() => setDark(!dark)} />
        <Row icon={Download} label="Экспорт данных (JSON)" onClick={exportJson} />
        <Row
          icon={Plus}
          label="Создать приглашение"
          onClick={() => setInvite(Math.random().toString(36).slice(2, 10).toUpperCase())}
        />
        <Row icon={LogOut} label="Выйти" danger onClick={onLogout} />
      </Card>

      {invite && (
        <Card className="mt-4">
          <p className="text-sm text-slate-500">Код приглашения (действует 7 дней, одноразовый):</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-indigo-500">{invite}</p>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Операций в данных: {txs.length}. Сегодня: {TODAY}
      </p>
    </Page>
  )
}

function Row({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-100/70 dark:hover:bg-white/5 ${
        danger ? 'text-rose-500' : ''
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  )
}

// ───────────── Добавление операции ─────────────

export function AddSheet({
  cats,
  onSave,
  onClose,
}: {
  cats: Category[]
  onSave: (t: Tx) => void
  onClose: () => void
}) {
  const [type, setType] = useState<TxType>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [catId, setCatId] = useState('')
  const [date, setDate] = useState(TODAY)
  const [note, setNote] = useState('')

  const options = cats.filter((c) => c.kind === 'BOTH' || c.kind === type)
  const chosen = options.some((o) => o.id === catId) ? catId : (options[0]?.id ?? '')
  const minor = Math.round(parseFloat(amount.replace(',', '.')) * 100)
  const valid = Number.isFinite(minor) && minor > 0 && chosen !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({ id: `t${Date.now()}`, type, amountMinor: minor, categoryId: chosen, date, note: note.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 md:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Новая операция</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              ['EXPENSE', 'Расход'],
              ['INCOME', 'Доход'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`rounded-xl py-2 font-medium transition ${
                type === v
                  ? v === 'INCOME'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'bg-rose-500 text-white shadow'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-6 text-center">
          <input
            inputMode="decimal"
            autoFocus
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full bg-transparent text-center text-5xl font-bold tabular-nums outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
          <p className="text-sm text-slate-400">рублей</p>
        </div>

        <p className="mb-2 text-sm font-medium text-slate-500">Категория</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatId(c.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                chosen === c.id ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
              style={chosen === c.id ? { background: c.color } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className={inputCls} placeholder="Заметка" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {amount && !valid && <p className="mb-3 text-sm text-rose-500">Сумма должна быть больше нуля</p>}

        <button className={`${btnPrimary} mt-2 w-full`} disabled={!valid}>
          Сохранить
        </button>
      </motion.form>
    </div>
  )
}
