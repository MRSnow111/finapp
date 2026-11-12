import { useEffect, useState } from 'react';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';
import { listTransactions } from '../services/transactions';
import type { Category } from '../types';
import { Alert } from '../components/Alert';
import { Button, Card, ConfirmDialog, Input, Label, Modal, Select } from '../components/ui';

const COLORS = [
  '#8EB69B', '#6FAFA4', '#7FA6D0', '#9AA8E0', '#7C9A8B',
  '#D9B26A', '#E08A78', '#B8DCC3', '#8EE3A6',
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usedCategoryIds, setUsedCategoryIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Форма
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [color, setColor] = useState(COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Удаление
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listCategories(), listTransactions()])
      .then(([cats, txs]) => {
        setCategories(cats);
        setUsedCategoryIds(new Set(txs.map((t) => t.category_id).filter((id): id is number => id !== null)));
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setType('EXPENSE');
    setColor(COLORS[0]);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    setFormError(null);
    if (!name.trim()) {
      setFormError('Введите название категории');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const updated = await updateCategory(editing.id, { name: name.trim(), type, color });
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
      } else {
        const created = await createCategory({ name: name.trim(), type, color, icon: null });
        setCategories((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Не удалось сохранить категорию');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteCategory(deleting.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (err: any) {
      setDeleting(null);
      const detail = err.response?.data?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Не удалось удалить категорию');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sage">Загрузка…</div>;
  }

  const typeLabel: Record<string, string> = {
    EXPENSE: 'Расход',
    INCOME: 'Доход',
    BOTH: 'Доход и расход',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-mint">Категории</h1>
        <Button onClick={openCreate}>+ Категория</Button>
      </div>

      <Alert message={error ?? ''} />
      <Alert message={deleteError ?? ''} />

      {categories.length === 0 ? (
        <Card className="text-center text-sage">
          Категорий пока нет. Создайте первую — кнопка «+ Категория».
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => {
            const used = usedCategoryIds.has(c.id);
            return (
              <Card key={c.id} className="flex items-center justify-between !p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 rounded-xl shadow-[0_0_16px_currentColor] ring-1 ring-white/10"
                    style={{ backgroundColor: c.color, color: c.color }}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-mint">{c.name}</div>
                    <div className="text-xs text-sage/80">
                      {typeLabel[c.type] ?? c.type}
                      {used && ' · используется'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pl-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg px-2 py-1 text-sm text-sage/60 transition-colors hover:bg-moss hover:text-mint"
                    title="Переименовать"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => { setDeleteError(null); setDeleting(c); }}
                    disabled={used}
                    className="rounded-lg px-2 py-1 text-sm text-sage/60 transition-colors hover:bg-expense/10 hover:text-expense disabled:pointer-events-none disabled:opacity-25"
                    title={used ? 'Есть операции в этой категории' : 'Удалить'}
                  >
                    ✕
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} title={editing ? 'Изменить категорию' : 'Новая категория'} onClose={() => setFormOpen(false)}>
        <div className="space-y-3">
          <Alert message={formError ?? ''} />
          <div>
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              placeholder="Например: Продукты"
            />
          </div>
          <div>
            <Label>Тип</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="EXPENSE">Расход</option>
              <option value="INCOME">Доход</option>
              <option value="BOTH">Доход и расход</option>
            </Select>
          </div>
          <div>
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full transition-transform duration-200 hover:scale-110 ${
                    color === c ? 'ring-2 ring-mint ring-offset-2 ring-offset-forest' : 'ring-1 ring-white/15'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={busy}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить категорию?"
        message={deleting ? `Категория «${deleting.name}» будет удалена безвозвратно.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deleteBusy}
      />
    </div>
  );
}
