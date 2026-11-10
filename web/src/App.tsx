import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChartPie, House, History, Tags, UserRound } from 'lucide-react'
import {
  type Category,
  type Tx,
  CURRENT_MONTH,
  initialCategories,
  initialTransactions,
} from './mock'
import {
  AddSheet,
  AuthScreen,
  CategoriesScreen,
  HistoryScreen,
  HomeScreen,
  ProfileScreen,
  StatsScreen,
} from './screens'

type Tab = 'home' | 'history' | 'stats' | 'categories' | 'profile'

const NAV = [
  { id: 'home', label: 'Главная', icon: House },
  { id: 'history', label: 'История', icon: History },
  { id: 'stats', label: 'Статистика', icon: ChartPie },
  { id: 'categories', label: 'Категории', icon: Tags },
  { id: 'profile', label: 'Профиль', icon: UserRound },
] as const

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [txs, setTxs] = useState<Tx[]>(initialTransactions)
  const [cats, setCats] = useState<Category[]>(initialCategories)
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [adding, setAdding] = useState(false)
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  if (!authed) return <AuthScreen onLogin={() => setAuthed(true)} />

  const remove = (id: string) => setTxs((prev) => prev.filter((t) => t.id !== id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Боковое меню (десктоп) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 border-r border-slate-900/5 bg-white/70 p-4 backdrop-blur md:flex dark:border-white/10 dark:bg-slate-900/70">
        <div className="mb-6 flex items-center gap-3 px-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">₽</span>
          Финансы
        </div>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium transition ${
              tab === id
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </aside>

      <main className="md:pl-60">
        {tab === 'home' && <HomeScreen txs={txs} cats={cats} month={month} setMonth={setMonth} onAdd={() => setAdding(true)} />}
        {tab === 'history' && <HistoryScreen txs={txs} cats={cats} onDelete={remove} />}
        {tab === 'stats' && <StatsScreen txs={txs} cats={cats} month={month} setMonth={setMonth} />}
        {tab === 'categories' && <CategoriesScreen cats={cats} setCats={setCats} txs={txs} />}
        {tab === 'profile' && (
          <ProfileScreen dark={dark} setDark={setDark} onLogout={() => setAuthed(false)} txs={txs} cats={cats} />
        )}
      </main>

      {/* Нижняя навигация (мобильная) */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-3xl bg-white/85 p-2 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur md:hidden dark:bg-slate-900/85 dark:ring-white/10">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium transition ${
              tab === id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {adding && (
          <AddSheet
            cats={cats}
            onSave={(t) => setTxs((prev) => [t, ...prev])}
            onClose={() => setAdding(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
