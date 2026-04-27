import type {
  CellValue,
  ColumnMapping,
  CompareMode,
  FileData,
  LookupRule,
  MergedResult,
  RuleStats,
} from '../types';

/** Normalize a key cell according to the chosen compare mode. */
export function normalizeKey(value: CellValue, mode: CompareMode): string {
  if (value === null || value === undefined) return '';
  let s: string;
  if (value instanceof Date) {
    s = value.toISOString();
  } else if (typeof value === 'number') {
    s = String(value);
  } else if (typeof value === 'boolean') {
    s = value ? 'true' : 'false';
  } else {
    s = String(value);
  }
  switch (mode) {
    case 'exact':
      return s;
    case 'caseInsensitive':
      return s.toLowerCase();
    case 'trim':
      return s.trim();
    case 'normalize':
      return s.trim().toLowerCase().replace(/\s+/g, ' ');
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
 * Returns the merged columns/rows and per-rule stats.
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

    // Resolve source-column indices and column placement plan
    const sourceIdxs = rule.columns.map((c) => srcSheet.columns.indexOf(c.sourceColumn));
    const plan = planInsertion(columns, rule.columns);

    // For each new column, capture the mapping resolved name
    const insertedAt: number[] = plan.insertOrder.map((p) => p.finalIndex);

    // Build the new rows: insert placeholder cells at planned positions, then fill.
    const noMatchValue: CellValue =
      rule.noMatch === 'empty' ? null : rule.noMatch === 'na' ? 'N/D' : (rule.noMatchCustom ?? '');

    let matchCount = 0;
    const concatSep = rule.concatSeparator ?? '; ';

    const nextRows: CellValue[][] = new Array(rows.length);
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const keyVal = row[mainKeyIdx] ?? null;
      const k = normalizeKey(keyVal, rule.compareMode);
      const matches = k === '' ? undefined : index.get(k);

      // Compute the values for each new column for this row
      const newValues: CellValue[] = new Array(rule.columns.length);
      if (matches && matches.length > 0) {
        matchCount++;
        for (let c = 0; c < rule.columns.length; c++) {
          const sIdx = sourceIdxs[c];
          if (sIdx === -1) {
            newValues[c] = noMatchValue;
            continue;
          }
          if (rule.multiMatch === 'first') {
            newValues[c] = srcSheet.rows[matches[0]][sIdx] ?? noMatchValue;
          } else if (rule.multiMatch === 'last') {
            newValues[c] = srcSheet.rows[matches[matches.length - 1]][sIdx] ?? noMatchValue;
          } else {
            const collected = matches
              .map((mi) => cellToString(srcSheet.rows[mi][sIdx]))
              .filter((s) => s.length > 0);
            newValues[c] = collected.length > 0 ? collected.join(concatSep) : noMatchValue;
          }
        }
      } else {
        for (let c = 0; c < rule.columns.length; c++) newValues[c] = noMatchValue;
      }

      // Build the new row by inserting newValues at insertedAt indices.
      // Important: we must insert in the same order as plan.insertOrder, mutating a working copy.
      const built: CellValue[] = [...row];
      for (let c = 0; c < rule.columns.length; c++) {
        built.splice(insertedAt[c], 0, newValues[c]);
      }
      nextRows[r] = built;
    }

    columns = plan.finalColumns;
    rows = nextRows;
    stats.push({
      ruleId: rule.id,
      processed: rows.length,
      matches: matchCount,
      noMatches: rows.length - matchCount,
    });

    stepIndex++;
    onProgress?.(stepIndex / totalSteps);
  }

  return { columns, rows, stats };
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
