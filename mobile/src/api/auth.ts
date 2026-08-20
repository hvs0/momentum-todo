import { api } from './client';
import { ApiEnvelope, AuthSession, User } from '../types';

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/register', payload);
  return data.data;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/login', payload);
  return data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function meRequest(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<{ user: User }>>('/auth/me');
  return data.data.user;
}
