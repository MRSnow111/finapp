import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/ui';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up max-w-md text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sage to-pine text-3xl font-black text-deep shadow-xl shadow-sage/20">
          ₽
        </div>
        <h1 className="mb-3 text-5xl font-black tracking-tight text-mint">FinApp</h1>
        <p className="mb-10 text-sage">
          Личный учёт доходов и расходов. Регистрация только по приглашению.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/login" className={buttonClasses('primary', 'px-8 py-3')}>
            Войти
          </Link>
          <Link to="/signup" className={buttonClasses('secondary', 'px-8 py-3')}>
            Регистрация по инвайту
          </Link>
        </div>
      </div>
    </div>
  );
}
