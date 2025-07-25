import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SystemConfig } from '@/hooks/useHasuraApi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency?: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);

  return formatted;
}

export function formatCurrencyWithConfig(amount: string | number, systemConfig: any): string {
  const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'RWF';
  return formatCurrency(amount, currency);
}
