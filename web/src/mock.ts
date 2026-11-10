// Демо-данные и расчёты для макета. Суммы хранятся в копейках (целое число).

export type TxType = 'INCOME' | 'EXPENSE'
export type CatKind = 'INCOME' | 'EXPENSE' | 'BOTH'

export interface Category {
  id: string
  name: string
  color: string
  kind: CatKind
}

export interface Tx {
  id: string
  type: TxType
  amountMinor: number
  categoryId: string
  date: string // YYYY-MM-DD
  note: string
}

export const TODAY = '2026-11-09'
export const CURRENT_MONTH = '2026-11'

export const PALETTE = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#64748b']

export const initialCategories: Category[] = [
  { id: 'salary', name: 'Зарплата', color: '#10b981', kind: 'INCOME' },
  { id: 'food', name: 'Продукты', color: '#22c55e', kind: 'EXPENSE' },
  { id: 'transport', name: 'Транспорт', color: '#3b82f6', kind: 'EXPENSE' },
  { id: 'home', name: 'Жильё', color: '#a855f7', kind: 'EXPENSE' },
  { id: 'health', name: 'Здоровье', color: '#ef4444', kind: 'EXPENSE' },
  { id: 'fun', name: 'Развлечения', color: '#f59e0b', kind: 'EXPENSE' },
  { id: 'other', name: 'Прочее', color: '#64748b', kind: 'BOTH' },
]

export const initialTransactions: Tx[] = [
  { id: 't1', type: 'INCOME', amountMinor: 14500000, categoryId: 'salary', date: '2026-11-05', note: 'Зарплата за октябрь' },
  { id: 't2', type: 'EXPENSE', amountMinor: 4500000, categoryId: 'home', date: '2026-11-01', note: 'Аренда квартиры' },
  { id: 't3', type: 'EXPENSE', amountMinor: 486050, categoryId: 'food', date: '2026-11-08', note: 'Перекрёсток' },
  { id: 't4', type: 'EXPENSE', amountMinor: 12000, categoryId: 'transport', date: '2026-11-08', note: 'Метро' },
  { id: 't5', type: 'EXPENSE', amountMinor: 89900, categoryId: 'fun', date: '2026-11-07', note: 'Кино и кафе' },
  { id: 't6', type: 'EXPENSE', amountMinor: 230000, categoryId: 'health', date: '2026-11-04', note: 'Стоматолог' },
  { id: 't7', type: 'INCOME', amountMinor: 350000, categoryId: 'other', date: '2026-11-03', note: 'Продажа старого велосипеда' },
  { id: 't8', type: 'EXPENSE', amountMinor: 315000, categoryId: 'food', date: '2026-10-28', note: 'Закупка на неделю' },
  { id: 't9', type: 'EXPENSE', amountMinor: 75000, categoryId: 'transport', date: '2026-10-20', note: 'Такси' },
  { id: 't10', type: 'INCOME', amountMinor: 14500000, categoryId: 'salary', date: '2026-10-05', note: 'Зарплата за сентябрь' },
  { id: 't11', type: 'EXPENSE', amountMinor: 4500000, categoryId: 'home', date: '2026-10-01', note: 'Аренда квартиры' },
  { id: 't12', type: 'EXPENSE', amountMinor: 620000, categoryId: 'fun', date: '2026-09-15', note: 'Поездка на выходные' },
]

const moneyFmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })
export const money = (minor: number) => moneyFmt.format(minor / 100)

export const monthOf = (date: string) => date.slice(0, 7)

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function dayLabel(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function totals(txs: Tx[], month: string) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (monthOf(t.date) !== month) continue
    if (t.type === 'INCOME') income += t.amountMinor
    else expense += t.amountMinor
  }
  return { income, expense, balance: income - expense }
}

export function expenseByCategory(txs: Tx[], cats: Category[], month: string) {
  const sums = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'EXPENSE' || monthOf(t.date) !== month) continue
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountMinor)
  }
  return [...sums.entries()]
    .map(([id, value]) => {
      const c = cats.find((x) => x.id === id)
      return { name: c?.name ?? 'Без категории', color: c?.color ?? '#94a3b8', value }
    })
    .sort((a, b) => b.value - a.value)
}

export function monthlySeries(txs: Tx[], month: string, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const m = shiftMonth(month, i - (n - 1))
    const t = totals(txs, m)
    return { label: monthLabel(m).slice(0, 3), income: t.income / 100, expense: t.expense / 100 }
  })
}
