import type {
  CellMark,
  CellValue,
  ColumnMapping,
  CompareMode,
  FileData,
  LookupRule,
  MergedResult,
  MultiMatchMode,
  RuleStats,
} from '../types';

/**
 * Deterministic stringification used as the foundation for every comparison
 * mode. Numbers are rendered with `String(n)` so that integer values never
 * fall back to scientific notation and decimals strip trailing zeros
 * (`12.50` is the same JS number as `12.5` and renders as `"12.5"`).
 */
function deterministicStringify(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return String(value);
}

const NUMERIC_RE = /^(-?)(\d+)(\.\d+)?$/;

/** Normalize a key cell according to the chosen compare mode. */
export function normalizeKey(value: CellValue, mode: CompareMode): string {
  const raw = deterministicStringify(value);
  switch (mode) {
    case 'exact':
      return raw;
    case 'caseInsensitive':
      return raw.toLowerCase();
    case 'trim':
      return raw.trim();
    case 'normalize':
      return raw.trim().toLowerCase().replace(/\s+/g, ' ');
    case 'numeric': {
      // Keep only digits, drop leading zeros. Empty if no digit is present.
      const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
      return digits;
    }
    case 'smart':
    default: {
      // 1) Map space-like invisible chars to a regular space; strip zero-width
      //    characters entirely. Both come from PDF copy-paste.
      // 2) Trim, collapse internal whitespace, lowercase.
      let s = raw
        .replace(/[\u00A0\t\n\r]/g, ' ')
        .replace(/[\u200B\uFEFF]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
      // 3) If the string is a plain number without a significant leading zero
      //    (so "00123" stays "00123" but "12.50" becomes "12.5"), canonicalize
      //    through Number() to bridge string⇄number type mismatches.
      const m = NUMERIC_RE.exec(s);
      if (m) {
        const intPart = m[2];
        const hasLeadingZero = intPart.length > 1 && intPart.startsWith('0');
        if (!hasLeadingZero) {
          const n = Number(s);
          if (Number.isFinite(n)) s = String(n);
        }
      }
      return s;
    }
  }
}

/** Build a Map<key, rowIndices[]> for a source sheet column. */
function buildIndex(
  rows: CellValue[][],
  columnIndex: number,
  mode: CompareMode,
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (let i = 0; i < rows.length; i++) {
    const k = normalizeKey(rows[i][columnIndex] ?? null, mode);
    if (k === '') continue;
    const list = map.get(k);
    if (list) list.push(i);
    else map.set(k, [i]);
  }
  return map;
}

/** Resolve insertion order for new columns, handling 'append' / 'after' / 'index'. */
function planInsertion(
  baseColumns: string[],
  mappings: ColumnMapping[],
): { finalColumns: string[]; insertOrder: { mapping: ColumnMapping; finalIndex: number }[] } {
  const cols = [...baseColumns];
  const placements: { mapping: ColumnMapping; finalIndex: number }[] = [];
  for (const m of mappings) {
    const name = uniqueName(m.outputName, cols);
    let pos: number;
    if (m.position.type === 'append') {
      pos = cols.length;
    } else if (m.position.type === 'after') {
      const idx = cols.indexOf(m.position.columnName);
      pos = idx === -1 ? cols.length : idx + 1;
    } else {
      pos = Math.max(0, Math.min(m.position.index, cols.length));
    }
    cols.splice(pos, 0, name);
    placements.push({ mapping: { ...m, outputName: name }, finalIndex: pos });
  }
  return { finalColumns: cols, insertOrder: placements };
}

function uniqueName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name;
  let i = 2;
  while (existing.includes(`${name} (${i})`)) i++;
  return `${name} (${i})`;
}

/** Convert a cell to its string form for concatenation/no-match output. */
function cellToString(v: CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toLocaleDateString('it-IT');
  return String(v);
}

/** A cell is "empty" iff null, undefined, or "". Strings of spaces or "-" / "N/D" are NOT empty. */
function isEmptyCell(v: CellValue): boolean {
  return v === null || v === undefined || v === '';
}

/** Resolve the source value for a key match according to multi-match mode. */
function resolveMatchValue(
  rows: CellValue[][],
  matches: number[],
  sourceIdx: number,
  mode: MultiMatchMode,
  concatSep: string,
): CellValue {
  if (mode === 'first') return rows[matches[0]][sourceIdx];
  if (mode === 'last') return rows[matches[matches.length - 1]][sourceIdx];
  const collected = matches
    .map((mi) => cellToString(rows[mi][sourceIdx]))
    .filter((s) => s.length > 0);
  return collected.length > 0 ? collected.join(concatSep) : null;
}

interface ApplyRulesArgs {
  mainFile: FileData;
  /** All known files indexed by id, including main + sources. */
  filesById: Record<string, FileData>;
  rules: LookupRule[];
  /** Optional progress callback (0..1). */
  onProgress?: (fraction: number) => void;
}

/**
 * Apply lookup rules sequentially against the main file's active sheet.
 * Returns the merged columns/rows and per-rule stats, plus per-cell marks
 * for cells touched by fillExisting mappings.
 */
export function applyRules({
  mainFile,
  filesById,
  rules,
  onProgress,
}: ApplyRulesArgs): MergedResult {
  const mainSheet = mainFile.sheets[mainFile.activeSheetIndex];
  let columns: string[] = [...mainSheet.columns];
  let rows: CellValue[][] = mainSheet.rows.map((r) => [...r]);
  const stats: RuleStats[] = [];
  const cellMarks = new Map<string, CellMark>();

  const totalSteps = rules.length || 1;
  let stepIndex = 0;

  for (const rule of rules) {
    const sourceFile = filesById[rule.sourceFileId];
    if (!sourceFile) {
      stats.push({ ruleId: rule.id, processed: rows.length, matches: 0, noMatches: rows.length });
      continue;
    }
    const srcSheet = sourceFile.sheets[sourceFile.activeSheetIndex];
    const srcKeyIdx = srcSheet.columns.indexOf(rule.sourceKey);
    const mainKeyIdx = columns.indexOf(rule.mainKey);
    if (srcKeyIdx === -1 || mainKeyIdx === -1 || rule.columns.length === 0) {
      stats.push({ ruleId: rule.id, processed: rows.length, matches: 0, noMatches: rows.length });
      continue;
    }
    const index = buildIndex(srcSheet.rows, srcKeyIdx, rule.compareMode);
    const noMatchValue: CellValue =
      rule.noMatch === 'empty' ? null : rule.noMatch === 'na' ? 'N/D' : (rule.noMatchCustom ?? '');
    const concatSep = rule.concatSeparator ?? '; ';

    // Split mappings by mode. Plan insertions only for newColumn mappings so that
    // fillExisting never appends a new column to the output.
    const newColMappings = rule.columns.filter((c) => c.writeMode === 'newColumn');
    const fillMappings = rule.columns.filter((c) => c.writeMode === 'fillExisting');

    const plan = planInsertion(columns, newColMappings);
    const insertedAt = plan.insertOrder.map((p) => p.finalIndex);
    const newColSourceIdxs = newColMappings.map((m) => srcSheet.columns.indexOf(m.sourceColumn));

    // For fillExisting, resolve target column indices in the *post-insertion* column array.
    const fillTargets = fillMappings.map((m) => {
      const targetName = m.targetColumn ?? '';
      return {
        mapping: m,
        targetColumnName: targetName,
        targetIndex: targetName ? plan.finalColumns.indexOf(targetName) : -1,
        sourceIdx: srcSheet.columns.indexOf(m.sourceColumn),
      };
    });

    let matchCount = 0;
    let filledCount = 0;
    let overwrittenCount = 0;
    let untouchedCount = 0;

    const nextRows: CellValue[][] = new Array(rows.length);
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const keyVal = row[mainKeyIdx] ?? null;
      const k = normalizeKey(keyVal, rule.compareMode);
      const matches = k === '' ? undefined : index.get(k);
      const keyMatched = !!(matches && matches.length > 0);
      if (keyMatched) matchCount++;

      // 1) Build the row with new-column values inserted.
      const built: CellValue[] = [...row];
      for (let c = 0; c < newColMappings.length; c++) {
        const sIdx = newColSourceIdxs[c];
        let val: CellValue;
        if (!keyMatched || sIdx === -1) {
          val = noMatchValue;
        } else {
          const raw = resolveMatchValue(srcSheet.rows, matches!, sIdx, rule.multiMatch, concatSep);
          val = isEmptyCell(raw) ? noMatchValue : raw;
        }
        built.splice(insertedAt[c], 0, val);
      }

      // 2) Apply fillExisting writes against `built`. Indices are already in the
      // post-insertion column space, so they are stable as we splice above.
      for (const ft of fillTargets) {
        if (ft.targetIndex === -1 || ft.sourceIdx === -1) {
          untouchedCount++;
          continue;
        }
        const cur = built[ft.targetIndex];
        const cellEmpty = isEmptyCell(cur);
        const force = ft.mapping.forceOverwrite === true;

        let valueToWrite: CellValue;
        if (keyMatched) {
          const raw = resolveMatchValue(
            srcSheet.rows,
            matches!,
            ft.sourceIdx,
            rule.multiMatch,
            concatSep,
          );
          valueToWrite = isEmptyCell(raw) ? noMatchValue : raw;
        } else {
          valueToWrite = noMatchValue;
        }
        const writeIsBlank = isEmptyCell(valueToWrite);

        if (cellEmpty) {
          if (writeIsBlank) {
            untouchedCount++;
          } else {
            built[ft.targetIndex] = valueToWrite;
            cellMarks.set(`${r}:${ft.targetColumnName}`, 'filled');
            filledCount++;
          }
        } else {
          // Cell already has a value: only overwrite when force AND we have a real key match
          // AND the resolved write is non-blank.
          if (force && keyMatched && !writeIsBlank) {
            built[ft.targetIndex] = valueToWrite;
            cellMarks.set(`${r}:${ft.targetColumnName}`, 'overwritten');
            overwrittenCount++;
          } else {
            untouchedCount++;
          }
        }
      }

      nextRows[r] = built;
    }

    columns = plan.finalColumns;
    rows = nextRows;

    const ruleStats: RuleStats = {
      ruleId: rule.id,
      processed: rows.length,
      matches: matchCount,
      noMatches: rows.length - matchCount,
    };
    if (fillMappings.length > 0) {
      ruleStats.filled = filledCount;
      ruleStats.overwritten = overwrittenCount;
      ruleStats.untouched = untouchedCount;
    }
    stats.push(ruleStats);

    stepIndex++;
    onProgress?.(stepIndex / totalSteps);
  }

  return { columns, rows, stats, cellMarks };
}

/** Threshold above which the lookup should run in a Web Worker. */
export const WORKER_ROW_THRESHOLD = 5000;

/** Sum of relevant rows across the main sheet and source sheets used by the rules. */
export function totalRowsTouched(mainFile: FileData, files: FileData[], rules: LookupRule[]): number {
  const mainRows = mainFile.sheets[mainFile.activeSheetIndex]?.rows.length ?? 0;
  let extra = 0;
  for (const r of rules) {
    const f = files.find((x) => x.id === r.sourceFileId);
    if (f) extra += f.sheets[f.activeSheetIndex]?.rows.length ?? 0;
  }
  return mainRows + extra;
}
