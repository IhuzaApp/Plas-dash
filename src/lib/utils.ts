import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SystemConfig } from '@/hooks/useHasuraApi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, config: SystemConfig): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatted = new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: config.currency || 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);

  return formatted;
}
