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
