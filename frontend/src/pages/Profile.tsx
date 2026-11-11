import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../routes/Protected';
import { useTheme, type Theme } from '../hooks/useTheme';
import { changePassword, exportData, importData, deleteAccount, updateName } from '../services/profile';
import { Alert } from '../components/Alert';
import { Button, Card, Input, Label, ConfirmDialog } from '../components/ui';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Системная' },
];

export default function Profile() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Смена имени
  const [name, setName] = useState(user?.name ?? '');
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Смена пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Импорт
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  // Удаление аккаунта
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await updateName(name.trim());
      setNameMsg({ ok: true, text: res.message });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setNameMsg({ ok: false, text: typeof detail === 'string' ? detail : 'Не удалось обновить имя' });
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== repeatPassword) {
      setPasswordMsg({ ok: false, text: 'Пароли не совпадают' });
      return;
    }
    setPasswordBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ ok: true, text: 'Пароль изменён' });
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setPasswordMsg({
        ok: false,
        text: typeof detail === 'string' ? detail : 'Не удалось изменить пароль',
      });
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleImport(e: FormEvent) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setImportMsg(null);
    setImportBusy(true);
    try {
      const res = await importData(file);
      setImportMsg({
        ok: true,
        text: `Импортировано: категорий ${res.categories}, операций ${res.transactions}. Обновите страницу.`,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setImportMsg({
        ok: false,
        text: typeof detail === 'string' ? detail : 'Не удалось импортировать файл',
      });
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      navigate('/login', { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Не удалось удалить аккаунт');
      setDeleteBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-mint">Профиль</h1>

      {/* Данные аккаунта */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-mint">Данные аккаунта</h2>
        <div className="text-sm text-sage">Email: {user.email}</div>
        {nameMsg && <Alert message={nameMsg.ok ? `✓ ${nameMsg.text}` : nameMsg.text} />}
        <form onSubmit={handleNameSubmit} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          <Button type="submit" className="shrink-0">Сохранить</Button>
        </form>
      </Card>

      {/* Смена пароля */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-mint">Смена пароля</h2>
        {passwordMsg && <Alert message={passwordMsg.ok ? `✓ ${passwordMsg.text}` : passwordMsg.text} />}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <Label>Текущий пароль</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label>Новый пароль (минимум 10 символов)</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Повторите новый пароль</Label>
            <Input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={passwordBusy}>
            {passwordBusy ? 'Сохраняем…' : 'Изменить пароль'}
          </Button>
        </form>
      </Card>

      {/* Тема */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-mint">Тема</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                theme === opt.value
                  ? 'bg-gradient-to-br from-accent to-accent2 text-deep shadow-lg shadow-sage/20'
                  : 'border border-pine bg-moss/60 text-sage hover:border-sage/60 hover:text-mint'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Данные */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-mint">Данные</h2>
        <p className="text-sm text-sage">
          Экспорт сохраняет категории и операции в JSON-файл. Импорт работает только в аккаунт
          без операций — например, для переноса на новый аккаунт.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => exportData()}>
            Экспорт JSON
          </Button>
          <Button variant="secondary" disabled={importBusy} onClick={() => fileInputRef.current?.click()}>
            {importBusy ? 'Импортируем…' : 'Импорт JSON'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {importMsg && <Alert message={importMsg.ok ? `✓ ${importMsg.text}` : importMsg.text} />}
      </Card>

      {/* Удаление аккаунта */}
      <Card className="space-y-3 border-expense/30">
        <h2 className="font-semibold text-expense">Удаление аккаунта</h2>
        <p className="text-sm text-sage">
          Аккаунт, все категории и операции будут удалены безвозвратно.
          Сначала экспортируйте данные, если они нужны.
        </p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Удалить аккаунт
        </Button>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить аккаунт навсегда?"
        message="Введите пароль для подтверждения. Все данные будут удалены безвозвратно."
        confirmLabel="Удалить аккаунт"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteError(null); setDeletePassword(''); }}
        busy={deleteBusy}
      >
        {deleteError && <Alert message={deleteError} />}
        <Input
          type="password"
          placeholder="Пароль"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="mb-5"
          autoComplete="current-password"
        />
      </ConfirmDialog>
    </div>
  );
}
