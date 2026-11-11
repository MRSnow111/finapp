import { api } from './api';

export interface Invite {
  id: number;
  email: string;
  expires_at: string;
  used_at: string | null;
}

export interface InviteCreated {
  id: number;
  email: string;
  code: string;
  expires_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export async function listInvites(): Promise<Invite[]> {
  const res = await api.get<Invite[]>('/invites/');
  return res.data;
}

export async function createInvite(email: string): Promise<InviteCreated> {
  const res = await api.post<InviteCreated>('/invites/', { email });
  return res.data;
}

export async function revokeInvite(id: number): Promise<void> {
  await api.delete(`/invites/${id}`);
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>('/users/');
  return res.data;
}

export async function setUserActive(id: number, active: boolean): Promise<AdminUser> {
  const res = await api.post<AdminUser>(`/users/${id}/${active ? 'unblock' : 'block'}`);
  return res.data;
}
