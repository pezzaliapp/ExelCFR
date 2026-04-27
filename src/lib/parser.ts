import * as XLSX from 'xlsx';
import type { CellValue, FileData, ParsedSheet } from '../types';

const TEXT_EXTS = new Set(['csv', 'tsv', 'txt']);

export function detectKind(name: string): FileData['kind'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'xls') return 'xls';
  return 'csv';
}

/** Detect the most likely CSV separator from a sample. */
export function detectSeparator(sample: string): ',' | ';' | '\t' {
  // Sample first 8 non-empty lines
  const lines = sample
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 8);
  if (lines.length === 0) return ',';
  const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];
  let best: ',' | ';' | '\t' = ',';
  let bestScore = -1;
  for (const sep of candidates) {
    const counts = lines.map((l) => l.split(sep).length);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    // Score: high column count + consistency between lines
    const score = min > 1 ? min * 10 - (max - min) : -1;
    if (score > bestScore) {
      bestScore = score;
      best = sep;
    }
  }
  return best;
}

/** Coerce SheetJS cell to our CellValue, preserving leading-zero strings. */
function coerceCell(v: unknown): CellValue {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  return String(v);
}

function sheetToParsed(
  sheet: XLSX.WorkSheet,
  name: string,
  hasHeader: boolean,
): ParsedSheet {
  // raw:false keeps Excel formatting cues; we still get string codes preserved
  // because we read CSV with raw text and read xlsx via aoa with raw values.
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
    raw: true,
  });
  if (aoa.length === 0) {
    return { name, columns: [], rows: [] };
  }
  const columnCount = aoa.reduce((n, r) => Math.max(n, r.length), 0);
  let columns: string[];
  let dataStart: number;
  if (hasHeader) {
    const headerRow = aoa[0];
    columns = Array.from({ length: columnCount }, (_, i) => {
      const raw = headerRow[i];
      const label = raw == null ? '' : String(raw).trim();
      return label.length > 0 ? label : `Colonna ${i + 1}`;
    });
    // De-dup duplicate header labels
    const seen = new Map<string, number>();
    columns = columns.map((c) => {
      const n = seen.get(c) ?? 0;
      seen.set(c, n + 1);
      return n === 0 ? c : `${c} (${n + 1})`;
    });
    dataStart = 1;
  } else {
    columns = Array.from({ length: columnCount }, (_, i) => `Colonna ${i + 1}`);
    dataStart = 0;
  }
  const rows: CellValue[][] = [];
  for (let i = dataStart; i < aoa.length; i++) {
    const r = aoa[i];
    const row: CellValue[] = new Array(columnCount).fill(null);
    for (let j = 0; j < columnCount; j++) {
      row[j] = coerceCell(r[j]);
    }
    rows.push(row);
  }
  return { name, columns, rows };
}

/** Parse an Excel file (xlsx/xls) into our FileData shape. */
export async function parseExcel(file: File, hasHeader: boolean): Promise<FileData> {
  const buf = await file.arrayBuffer();
  // cellDates true → JS dates; cellNF false to keep things simple
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheets: ParsedSheet[] = wb.SheetNames.map((n) =>
    sheetToParsed(wb.Sheets[n]!, n, hasHeader),
  );
  return {
    id: cryptoRandomId(),
    label: file.name,
    fileName: file.name,
    size: file.size,
    kind: detectKind(file.name),
    sheets,
    activeSheetIndex: 0,
    hasHeader,
  };
}

/** Parse a CSV/TSV/TXT file. */
export async function parseCsv(file: File, hasHeader: boolean): Promise<FileData> {
  const text = await file.text();
  const sample = text.slice(0, 4096);
  const sep = detectSeparator(sample);
  // Use SheetJS to parse CSV with the chosen FS so quoted fields are handled correctly.
  const wb = XLSX.read(text, { type: 'string', FS: sep, raw: true });
  const firstName = wb.SheetNames[0] ?? 'CSV';
  const parsed = sheetToParsed(wb.Sheets[firstName]!, 'CSV', hasHeader);
  return {
    id: cryptoRandomId(),
    label: file.name,
    fileName: file.name,
    size: file.size,
    kind: 'csv',
    csvSeparator: sep,
    sheets: [parsed],
    activeSheetIndex: 0,
    hasHeader,
  };
}

export async function parseFile(file: File, hasHeader = true): Promise<FileData> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (TEXT_EXTS.has(ext)) {
    return parseCsv(file, hasHeader);
  }
  return parseExcel(file, hasHeader);
}

/** Re-parse the active sheet of a file with a different hasHeader flag. */
export async function reparseFile(fileData: FileData, hasHeader: boolean, file: File): Promise<FileData> {
  return parseFile(file, hasHeader).then((next) => ({
    ...next,
    id: fileData.id, // keep id stable
    label: fileData.label,
    activeSheetIndex: Math.min(fileData.activeSheetIndex, next.sheets.length - 1),
  }));
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
