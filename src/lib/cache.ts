/**
 * Simple localStorage-based cache utility.
 */

const CACHE_PREFIX = 'plas_cache_';

export const cacheSet = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Failed to set cache:', e);
  }
};

export const cacheGet = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    const { data } = JSON.parse(cached);
    return data as T;
  } catch (e) {
    return null;
  }
};

export const cacheRemove = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
};
