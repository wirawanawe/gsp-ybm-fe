/**
 * API base URL - gunakan NEXT_PUBLIC_API_URL di .env.local untuk override.
 * Contoh: NEXT_PUBLIC_API_URL=http://192.168.18.49:5001 jika akses dari jaringan lain.
 */
export const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3331';

export function apiUrl(path: string): string {
  const base = String(API_BASE).replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Wrapper fetch yang otomatis menambahkan header Authorization dari token di localStorage.
 * Gunakan ini menggantikan fetch() biasa agar backend bisa mengetahui siapa yang membuat/mengedit data.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
