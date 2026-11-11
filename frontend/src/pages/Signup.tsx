import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Alert } from '../components/Alert';
import { Button, Input } from '../components/ui';

export default function Signup() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', {
        invite_code: code.trim().toUpperCase(),
        email,
        name,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      // Ошибки валидации pydantic приходят массивом
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail[0]?.msg ?? 'Проверьте введённые данные'
            : 'Ошибка регистрации',
      );
    } finally {
      setLoading(false);
    }
  }

  const shell = 'flex min-h-screen items-center justify-center px-4 py-10';
  const panel =
    'animate-fade-up w-full max-w-sm space-y-5 rounded-2xl border border-pine/60 bg-forest/75 p-7 shadow-2xl shadow-black/40 backdrop-blur-md';

  if (success) {
    return (
      <div className={shell}>
        <div className={`${panel} text-center`}>
          <h1 className="text-2xl font-bold text-mint">Аккаунт создан</h1>
          <p className="text-sage">Теперь вы можете войти.</p>
          <Link to="/login" className="font-medium text-accent hover:text-mint hover:underline">
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <form onSubmit={handleSubmit} className={panel}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-mint">Регистрация</h1>
          <p className="mt-1 text-sm text-sage">Нужен код приглашения от администратора</p>
        </div>
        <Alert message={error ?? ''} />
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Код приглашения"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="uppercase tracking-widest"
          />
          <Input
            type="email"
            placeholder="Email (указанный в приглашении)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
          />
          <Input
            type="password"
            placeholder="Пароль (минимум 10 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            maxLength={128}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Создаём аккаунт…' : 'Создать аккаунт'}
        </Button>
        <p className="text-center text-sm text-sage">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-mint hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
