import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Protected, { AdminOnly } from './routes/Protected';
import { Aurora } from './components/Aurora';
import { useTheme } from './hooks/useTheme';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

/** Применяет сохранённую тему при старте приложения. */
function ThemeInit() {
  useTheme();
  return null;
}

/** Все страницы после входа показываются внутри AppLayout. */
function WithLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <>
      <Aurora />
      <ThemeInit />
      <Router>
        <Routes>
          {/* Публичные */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* После входа */}
          <Route element={<Protected />}>
            <Route element={<WithLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route element={<AdminOnly />}>
              <Route element={<WithLayout />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}
