import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

let cachedUser: CurrentUser | null = null;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [loading, setLoading] = useState(cachedUser === null);

  useEffect(() => {
    if (cachedUser) return;
    let cancelled = false;
    api
      .get<CurrentUser>('/auth/me')
      .then((res) => {
        if (!cancelled) {
          cachedUser = res.data;
          setUser(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}

/** Защищённый маршрут: проверяет сессию через /api/auth/me. */
export default function Protected() {
  const { user, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="animate-pulse text-sage">Загрузка…</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  );
}

/** Раздел только для роли admin. */
export function AdminOnly() {
  const { user, loading } = useCurrentUser();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
