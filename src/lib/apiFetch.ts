/**
 * apiFetch — thin wrapper around fetch() for calls to the Laravel backend.
 *
 * All routes go through /api/* which Vercel rewrites to the Railway backend.
 * The Laravel token (Sanctum) is stored in localStorage under "laravel_token".
 *
 * Usage:
 *   const data = await apiFetch('/tour-packages');
 *   const data = await apiFetch('/bookings', { method: 'POST', body: JSON.stringify({...}) }, token);
 */

const BASE = import.meta.env.VITE_API_URL || '/api/v1';

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const stored = token ?? localStorage.getItem('laravel_token');
  if (stored) {
    headers['Authorization'] = `Bearer ${stored}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}
