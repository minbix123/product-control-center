import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ProductStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, timezone?: string): string {
  const date = new Date(dateStr);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  });
}

export function formatTime(dateStr: string, timezone?: string): string {
  const date = new Date(dateStr);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz,
  });
}

export function formatDateTime(dateStr: string, timezone?: string): string {
  return `${formatDate(dateStr, timezone)} ${formatTime(dateStr, timezone)}`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: ProductStatus): string {
  const colors: Record<ProductStatus, string> = {
    PLANNING: '#6366f1',
    TESTING: '#f59e0b',
    MANUFACTURING: '#3b82f6',
    READY: '#22c55e',
    PAUSED: '#a855f7',
    BLOCKED: '#ef4444',
    COMPLETED: '#14b8a6',
  };
  return colors[status] || '#6b7280';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function sanitizeInput(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) return `${fieldName} must be ${maxLength} characters or fewer`;
  return null;
}
