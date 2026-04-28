export type CellValue = string | number | boolean | Date | null;

export interface SheetMeta {
  /** Sheet name as defined in the workbook (or "CSV" for csv files). */
  name: string;
  /** Number of data rows (excluding header if hasHeader). */
  rowCount: number;
  /** Column labels as currently used. */
  columns: string[];
}

export interface FileData {
  /** Stable id used for keys and refs across React state. */
  id: string;
  /** User-editable label (defaults to filename). */
  label: string;
  /** Original filename. */
  fileName: string;
  /** Size in bytes. */
  size: number;
  /** "xlsx" | "xls" | "csv" — detected from extension. */
  kind: 'xlsx' | 'xls' | 'csv';
  /** Detected CSV separator (only meaningful when kind === 'csv'). */
  csvSeparator?: ',' | ';' | '\t';
  /** All sheets parsed from the workbook. CSV files have a single virtual sheet. */
  sheets: ParsedSheet[];
  /** Currently selected sheet index. */
  activeSheetIndex: number;
  /** Whether the first row is treated as header. */
  hasHeader: boolean;
}

export interface ParsedSheet {
  name: string;
  /** Header labels — synthesized as "Colonna 1", "Colonna 2"... when hasHeader is false. */
  columns: string[];
  /** Row data: array of arrays, aligned to columns. */
  rows: CellValue[][];
}

export type CompareMode =
  | 'smart'
  | 'exact'
  | 'caseInsensitive'
  | 'trim'
  | 'normalize'
  | 'numeric';

export type NoMatchMode = 'empty' | 'na' | 'custom';

export type MultiMatchMode = 'first' | 'last' | 'concat';

export type WriteMode = 'newColumn' | 'fillExisting';

export interface ColumnMapping {
  /** Column name in the source file we are pulling from. */
  sourceColumn: string;
  /**
   * How the looked-up value is written into the output:
   * - 'newColumn'   → adds a new column (uses outputName + position)
   * - 'fillExisting' → writes into an already-present column on the main file
   *                    (uses targetColumn + forceOverwrite)
   * Default: 'newColumn'.
   */
  writeMode: WriteMode;
  /** Output column name (used only when writeMode === 'newColumn'). */
  outputName: string;
  /** Insertion strategy (used only when writeMode === 'newColumn'). */
  position:
    | { type: 'append' }
    | { type: 'after'; columnName: string }
    | { type: 'index'; index: number };
  /** Existing main-file column to fill (used only when writeMode === 'fillExisting'). */
  targetColumn?: string;
  /**
   * Used only when writeMode === 'fillExisting'.
   * If false (default), only empty cells (null / undefined / "") are filled.
   * If true, cells with a key-match are overwritten too.
   * Cells without a key-match are never overwritten by force.
   */
  forceOverwrite?: boolean;
}

export interface LookupRule {
  id: string;
  /** Source file id (which file we look up INTO). */
  sourceFileId: string;
  /** Key column on the main file. */
  mainKey: string;
  /** Key column on the source file. */
  sourceKey: string;
  compareMode: CompareMode;
  columns: ColumnMapping[];
  noMatch: NoMatchMode;
  noMatchCustom?: string;
  multiMatch: MultiMatchMode;
  /** Separator used when multiMatch === 'concat'. */
  concatSeparator?: string;
}

export interface RuleStats {
  ruleId: string;
  processed: number;
  matches: number;
  noMatches: number;
  /** Set only when the rule has at least one fillExisting mapping. */
  filled?: number;
  overwritten?: number;
  untouched?: number;
}

/** Mark for cells changed by a fillExisting mapping, used to highlight the preview. */
export type CellMark = 'filled' | 'overwritten';

export interface MergedResult {
  columns: string[];
  rows: CellValue[][];
  stats: RuleStats[];
  /**
   * Sparse cell-level marks for fillExisting writes.
   * Key format: `${rowIndex}:${columnName}` (column name is stable across rule shifts).
   */
  cellMarks: Map<string, CellMark>;
}

export interface ConfigExport {
  version: 1;
  rules: Array<Omit<LookupRule, 'sourceFileId'> & { sourceFileLabel: string }>;
  mainFileLabel?: string;
}
