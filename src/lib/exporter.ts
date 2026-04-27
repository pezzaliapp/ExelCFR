import * as XLSX from 'xlsx';
import type { CellValue, MergedResult } from '../types';

export interface XlsxExportOptions {
  filename: string;
  sheetName?: string;
}

export interface CsvExportOptions {
  filename: string;
  separator: ',' | ';' | '\t';
  withBOM: boolean;
}

function rowsToAOA(result: MergedResult): unknown[][] {
  const aoa: unknown[][] = [result.columns];
  for (const r of result.rows) {
    aoa.push(r.map(serializeCell));
  }
  return aoa;
}

function serializeCell(v: CellValue): unknown {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  return v;
}

export function exportXlsx(result: MergedResult, opts: XlsxExportOptions): void {
  const wb = XLSX.utils.book_new();
  const aoa = rowsToAOA(result);
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName ?? 'ExelCFR');
  XLSX.writeFile(wb, ensureExt(opts.filename, '.xlsx'), { compression: true });
}

export function exportCsv(result: MergedResult, opts: CsvExportOptions): void {
  // Build CSV manually so we control separator + BOM exactly.
  const lines = rowsToAOA(result).map((row) =>
    row.map((cell) => csvCell(cell, opts.separator)).join(opts.separator),
  );
  const text = lines.join('\r\n');
  const blob = new Blob([opts.withBOM ? '﻿' + text : text], {
    type: 'text/csv;charset=utf-8',
  });
  triggerDownload(blob, ensureExt(opts.filename, '.csv'));
}

function csvCell(v: unknown, sep: string): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (v instanceof Date) {
    s = v.toLocaleDateString('it-IT');
  } else {
    s = String(v);
  }
  const needsQuote = s.includes(sep) || s.includes('"') || s.includes('\n') || s.includes('\r');
  if (needsQuote) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function ensureExt(name: string, ext: string): string {
  return name.toLowerCase().endsWith(ext) ? name : name + ext;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function buildDefaultFilename(mainLabel: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  const base = mainLabel.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_');
  return `ExelCFR_${base || 'risultato'}_${stamp}`;
}
