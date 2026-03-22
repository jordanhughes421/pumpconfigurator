const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try { message = JSON.parse(text).error || text; } catch { message = text; }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function apiGet<T>(path: string): Promise<T> { return request<T>('GET', path); }
export function apiPost<T>(path: string, body: unknown): Promise<T> { return request<T>('POST', path, body); }
export function apiPut<T>(path: string, body: unknown): Promise<T> { return request<T>('PUT', path, body); }
export function apiDelete(path: string): Promise<void> { return request<void>('DELETE', path); }
