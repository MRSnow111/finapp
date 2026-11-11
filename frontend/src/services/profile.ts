import { api } from './api';

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/profile/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function exportData(): Promise<void> {
  const res = await api.get('/profile/export', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `finapp-export-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<{ categories: number; transactions: number }> {
  const text = await file.text();
  const payload = JSON.parse(text);
  const res = await api.post('/profile/import', payload);
  return res.data;
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/profile/account', { data: { password } });
}

export async function updateName(name: string): Promise<{ message: string; name: string }> {
  const res = await api.put('/profile/name', { name });
  return res.data;
}
