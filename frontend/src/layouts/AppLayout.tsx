import { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useCurrentUser } from '../routes/Protected';

const navItems = [
  { to: '/dashboard', label: 'Главная' },
  { to: '/history', label: 'История' },
  { to: '/statistics', label: 'Статистика' },
  { to: '/categories', label: 'Категории' },
  { to: '/profile', label: 'Профиль' },
];

const adminItem = { to: '/admin', label: 'Админка' };

function NavLinks({ variant }: { variant: 'desktop' | 'mobile' }) {
  const { user } = useCurrentUser();
  const items = user?.role === 'admin' ? [...navItems, adminItem] : navItems;
  const linkClass =
    variant === 'desktop'
      ? 'relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-moss/60'
      : 'relative flex flex-1 flex-col items-center rounded-xl py-2 text-[11px] font-medium transition-colors';

  return (
    <>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId={`${variant}-pill`}
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-sage/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative ${isActive ? 'text-deep' : 'text-sage hover:text-mint'}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

/**
 * Основной layout: боковое меню на десктопе, плавающая нижняя навигация на мобильных.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-pine/50 bg-forest/60 p-4 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-3 pt-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sage to-pine text-lg font-black text-deep shadow-lg shadow-sage/20">
            ₽
          </span>
          <span className="text-xl font-bold tracking-tight text-mint">FinApp</span>
        </div>
        <nav className="space-y-1">
          <NavLinks variant="desktop" />
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto rounded-xl px-4 py-2.5 text-left text-sm font-medium text-sage/70 transition-colors hover:bg-expense/10 hover:text-expense"
        >
          Выйти
        </button>
      </aside>

      <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mx-auto max-w-3xl"
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex rounded-2xl border border-pine/60 bg-forest/85 p-1 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden">
        <NavLinks variant="mobile" />
      </nav>
    </div>
  );
}
