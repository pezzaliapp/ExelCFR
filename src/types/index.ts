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

export type CompareMode = 'exact' | 'caseInsensitive' | 'trim' | 'normalize';

export type NoMatchMode = 'empty' | 'na' | 'custom';

export type MultiMatchMode = 'first' | 'last' | 'concat';

export interface ColumnMapping {
  /** Column name in the source file we are pulling from. */
  sourceColumn: string;
  /** Output column name (precompiled, editable). */
  outputName: string;
  /** Insertion strategy. */
  position:
    | { type: 'append' }
    | { type: 'after'; columnName: string }
    | { type: 'index'; index: number };
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
}

export interface MergedResult {
  columns: string[];
  rows: CellValue[][];
  stats: RuleStats[];
}

export interface ConfigExport {
  version: 1;
  rules: Array<Omit<LookupRule, 'sourceFileId'> & { sourceFileLabel: string }>;
  mainFileLabel?: string;
}
