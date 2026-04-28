import type { CellValue, CompareMode } from '../types';
import { normalizeKey } from './lookup';

/**
 * Documented behaviour of `normalizeKey` for each comparison mode.
 *
 * No test runner is wired into the project; this file exists so the
 * intent of every mode is reviewable in source and so a future test
 * runner (Vitest, Jest, Bun) can `import` it without changes.
 *
 * `expectedMatch` is the truth condition for `normalizeKey(left, mode)
 * === normalizeKey(right, mode)`.
 *
 * @internal
 */
export interface CompareCase {
  /** `undefined` is documented behaviour even though `CellValue` excludes it. */
  left: CellValue | undefined;
  right: CellValue | undefined;
  mode: CompareMode;
  expectedMatch: boolean;
  reason: string;
}

export const COMPARE_CASES: readonly CompareCase[] = [
  // ---------- Smart (default) ----------
  {
    left: '20100376',
    right: 20100376,
    mode: 'smart',
    expectedMatch: true,
    reason: 'principale stringa, sorgente int → match',
  },
  {
    left: '00123',
    right: '123',
    mode: 'smart',
    expectedMatch: false,
    reason: 'zeri iniziali significativi: vanno preservati',
  },
  {
    left: 'ART\u00A0001',
    right: 'ART 001',
    mode: 'smart',
    expectedMatch: true,
    reason: 'NBSP da copy-paste PDF equiparato a spazio normale',
  },
  {
    left: 'art-001',
    right: 'ART-001',
    mode: 'smart',
    expectedMatch: true,
    reason: 'case-insensitive di default',
  },
  {
    left: 'CODE  X  1',
    right: 'CODE X 1',
    mode: 'smart',
    expectedMatch: true,
    reason: 'spazi multipli interni collassati a uno solo',
  },
  {
    left: null,
    right: '',
    mode: 'smart',
    expectedMatch: true,
    reason: 'null e stringa vuota normalizzano entrambi a chiave vuota',
  },
  {
    left: undefined,
    right: null,
    mode: 'smart',
    expectedMatch: true,
    reason: 'undefined e null sono entrambi chiave vuota',
  },
  {
    left: 99999999999,
    right: '99999999999',
    mode: 'smart',
    expectedMatch: true,
    reason: 'interi grandi (entro Number.MAX_SAFE_INTEGER) senza notazione esponenziale',
  },
  {
    left: 12.5,
    right: '12.50',
    mode: 'smart',
    expectedMatch: true,
    reason: 'i decimali con zero di coda canonicalizzano',
  },
  {
    left: '\uFEFFCOD-1',
    right: 'COD-1',
    mode: 'smart',
    expectedMatch: true,
    reason: 'BOM iniziale rimosso',
  },
  {
    left: 'COD\u200B1',
    right: 'COD1',
    mode: 'smart',
    expectedMatch: true,
    reason: 'zero-width space rimosso',
  },

  // ---------- Exact ----------
  {
    left: 'ART001',
    right: 'art001',
    mode: 'exact',
    expectedMatch: false,
    reason: 'Esatto è case-sensitive',
  },
  {
    left: '20100376',
    right: 20100376,
    mode: 'exact',
    expectedMatch: true,
    reason: 'Esatto stringifica deterministicamente: numeri e stringhe identiche coincidono',
  },
  {
    left: ' 20100376',
    right: '20100376',
    mode: 'exact',
    expectedMatch: false,
    reason: 'Esatto non fa trim',
  },

  // ---------- Numeric ----------
  {
    left: '001234',
    right: '1234',
    mode: 'numeric',
    expectedMatch: true,
    reason: 'gli zeri iniziali sono ignorati',
  },
  {
    left: 'ART-1234',
    right: '1234',
    mode: 'numeric',
    expectedMatch: true,
    reason: 'i caratteri non-cifra sono rimossi',
  },
  {
    left: 'ABC',
    right: '',
    mode: 'numeric',
    expectedMatch: true,
    reason: 'una stringa senza cifre normalizza a vuoto (poi viene esclusa dall’indice)',
  },
];

/**
 * Tiny self-check helper. Not auto-run; can be invoked from a debug
 * console with `import('./lookup.test-cases').then((m) => m.runChecks())`.
 *
 * @internal
 */
export function runChecks(): { ok: number; failed: CompareCase[] } {
  const failed: CompareCase[] = [];
  let ok = 0;
  for (const c of COMPARE_CASES) {
    const left = (c.left ?? null) as CellValue;
    const right = (c.right ?? null) as CellValue;
    const matched = normalizeKey(left, c.mode) === normalizeKey(right, c.mode);
    if (matched === c.expectedMatch) ok++;
    else failed.push(c);
  }
  return { ok, failed };
}
