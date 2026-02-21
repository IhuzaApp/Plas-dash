/**
 * Client-side API helpers. Use these to fetch from /api routes instead of GraphQL.
 */

const getBaseUrl = () =>
  typeof window !== 'undefined' ? '' : process.env.NEXTAUTH_URL || 'http://localhost:3000';

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    // Check both potential session keys
    const orgSessionStr = localStorage.getItem('orgEmployeeSession');
    const projectSessionStr = localStorage.getItem('projectUserSession');

    const sessionStr = orgSessionStr || projectSessionStr;

    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.id) {
        return { Authorization: `Bearer ${session.id}` };
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return {};
};

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: { ...getAuthHeaders() },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}
