import type { CellValue } from '../types';

export function formatCell(v: CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toLocaleDateString('it-IT');
  if (typeof v === 'number') {
    if (Number.isFinite(v)) {
      // Avoid "1e21" notation for large ints; let Intl handle locale formatting.
      return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 6 }).format(v);
    }
    return String(v);
  }
  if (typeof v === 'boolean') return v ? 'Vero' : 'Falso';
  return v;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
