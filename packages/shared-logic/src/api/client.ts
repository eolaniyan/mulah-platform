/**
 * @mulah/shared-logic — API Client
 *
 * Platform-agnostic HTTP client. Works in:
 * - React web (apps/finance-web) via native fetch + cookies
 * - React Native (apps/finance-mobile) via fetch + SecureStore token
 *
 * Configure via setApiBaseUrl() before use (called by each app at startup).
 * Configure via setTokenProvider() for React Native (SecureStore).
 */

let API_BASE_URL = "";
let tokenProvider: (() => Promise<string | null>) | null = null;
let onUnauthorized: (() => void | Promise<void>) | null = null;

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url.replace(/\/$/, "");
}

export function setTokenProvider(provider: () => Promise<string | null>) {
  tokenProvider = provider;
}

/** React Native: clear SecureStore (or similar) when any request returns 401 */
export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  onUnauthorized = handler;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

async function buildHeaders(hasBody: boolean): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) {
      await onUnauthorized();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: await buildHeaders(false),
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: await buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: await buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: await buildHeaders(false),
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPostRaw(path: string, body?: unknown): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res;
}
