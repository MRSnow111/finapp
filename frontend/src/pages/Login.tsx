import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Alert } from '../components/Alert';
import { Button, Input } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="animate-fade-up w-full max-w-sm space-y-5 rounded-2xl border border-pine/60 bg-forest/75 p-7 shadow-2xl shadow-black/40 backdrop-blur-md"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-mint">Вход</h1>
          <p className="mt-1 text-sm text-sage">Войдите в свой аккаунт FinApp</p>
        </div>
        <Alert message={error ?? ''} />
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </Button>
        <p className="text-center text-sm text-sage">
          Нет аккаунта?{' '}
          <Link to="/signup" className="font-medium text-accent hover:text-mint hover:underline">
            Регистрация по инвайту
          </Link>
        </p>
      </form>
    </div>
  );
}
