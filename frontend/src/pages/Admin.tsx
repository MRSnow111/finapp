import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from '../components/Alert';
import { Button, Card, ConfirmDialog, Input, Modal } from '../components/ui';
import { formatDate } from '../utils/format';
import {
  type AdminUser,
  type Invite,
  type InviteCreated,
  createInvite,
  listInvites,
  listUsers,
  revokeInvite,
  setUserActive,
} from '../services/admin';

export default function Admin() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Новый инвайт
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<InviteCreated | null>(null);

  // Отзыв инвайта / блокировка
  const [revoking, setRevoking] = useState<Invite | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  useEffect(() => {
    Promise.all([listInvites(), listUsers()])
      .then(([inv, usr]) => {
        setInvites(inv);
        setUsers(usr);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setCreating(true);
    try {
      const inv = await createInvite(email.trim().toLowerCase());
      setInvites((prev) => [
        { id: inv.id, email: inv.email, expires_at: inv.expires_at, used_at: null },
        ...prev,
      ]);
      setCreated(inv);
      setEmail('');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось создать инвайт');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revoking) return;
    setRevokeBusy(true);
    try {
      await revokeInvite(revoking.id);
      setInvites((prev) => prev.filter((i) => i.id !== revoking.id));
      setRevoking(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось отозвать инвайт');
      setRevoking(null);
    } finally {
      setRevokeBusy(false);
    }
  }

  async function toggleUser(user: AdminUser) {
    setError(null);
    try {
      const updated = await setUserActive(user.id, !user.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(updated.is_active ? `Аккаунт ${updated.email} разблокирован` : `Аккаунт ${updated.email} заблокирован`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось изменить статус');
    }
  }

  async function copyCode() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setNotice('Код скопирован в буфер обмена');
    } catch {
      setNotice('Скопируйте код вручную');
    }
  }

  function inviteStatus(inv: Invite): { label: string; className: string } {
    if (inv.used_at) return { label: 'Использован', className: 'text-sage/60' };
    if (new Date(inv.expires_at).getTime() < Date.now()) return { label: 'Истёк', className: 'text-expense' };
    return { label: 'Активен', className: 'text-income' };
  }

  if (loading) {
    return <div className="py-20 text-center text-sage">Загрузка…</div>;
  }

  const pending = invites.filter((i) => !i.used_at);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-mint">Админка</h1>

      <Alert message={error ?? ''} />
      <Alert message={notice ? `✓ ${notice}` : ''} />

      {/* Создание инвайта */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-mint">Новое приглашение</h2>
        <p className="text-sm text-sage">
          Код показывается один раз и действует 7 дней. Передайте его вместе с email.
        </p>
        <form onSubmit={handleCreateInvite} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="shrink-0" disabled={creating}>
            {creating ? 'Создаём…' : 'Создать инвайт'}
          </Button>
        </form>
        {pending.length > 0 && (
          <div className="text-xs text-sage/70">Действующих приглашений: {pending.length}</div>
        )}
      </Card>

      {/* Инвайты */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-sage">Приглашения</h2>
        {invites.length === 0 ? (
          <Card className="text-center text-sage">Пока нет приглашений.</Card>
        ) : (
          <AnimatePresence initial={false}>
            {invites.map((inv) => {
              const status = inviteStatus(inv);
              const canRevoke = !inv.used_at;
              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="flex items-center justify-between !p-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-mint">{inv.email}</div>
                      <div className="text-xs text-sage/80">
                        до {formatDate(inv.expires_at.slice(0, 10))} ·{' '}
                        <span className={status.className}>{status.label}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setRevoking(inv)}
                      disabled={!canRevoke}
                      className="!px-2.5 !py-1.5"
                      title={canRevoke ? 'Отозвать' : 'Инвайт уже использован'}
                    >
                      Отозвать
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </section>

      {/* Пользователи */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-sage">Пользователи</h2>
        {users.map((u) => (
          <Card key={u.id} className="flex items-center justify-between !p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-mint">{u.name}</span>
                {u.role === 'admin' && (
                  <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    админ
                  </span>
                )}
                {!u.is_active && (
                  <span className="rounded-full bg-expense/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-expense">
                    заблокирован
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-sage/80">{u.email}</div>
            </div>
            {u.role !== 'admin' && (
              <Button
                variant={u.is_active ? 'ghost' : 'secondary'}
                onClick={() => toggleUser(u)}
                className="!px-2.5 !py-1.5"
              >
                {u.is_active ? 'Заблокировать' : 'Разблокировать'}
              </Button>
            )}
          </Card>
        ))}
      </section>

      {/* Код инвайта показывается один раз */}
      <Modal open={created !== null} title="Приглашение создано" onClose={() => setCreated(null)}>
        <div className="space-y-4">
          <p className="text-sm text-sage">
            Передайте код пользователю <span className="font-medium text-mint">{created?.email}</span>.
            Он больше не будет показан.
          </p>
          <div className="select-all break-all rounded-xl border border-sage/30 bg-deep/70 px-4 py-3 text-center text-lg font-bold tracking-[0.15em] text-mint">
            {created?.code}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={copyCode}>
              Скопировать
            </Button>
            <Button onClick={() => setCreated(null)}>Готово</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={revoking !== null}
        title="Отозвать приглашение?"
        message={revoking ? `Инвайт для ${revoking.email} станет недействительным.` : ''}
        confirmLabel="Отозвать"
        onConfirm={handleRevoke}
        onCancel={() => setRevoking(null)}
        busy={revokeBusy}
      />
    </div>
  );
}
