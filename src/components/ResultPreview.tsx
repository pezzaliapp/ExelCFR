import { formatCell } from '../lib/format';
import type { CellMark, MergedResult } from '../types';

interface Props {
  result: MergedResult;
  baseColumns: string[];
  maxRows?: number;
}

const FILL_BG = 'bg-emerald-50 dark:bg-emerald-950/40';
const OVERWRITE_BG = 'bg-amber-50 dark:bg-amber-950/40';
const NEW_COLUMN_BG = 'bg-brand-50/50 dark:bg-brand-950/30';

function classForMark(mark: CellMark | undefined, isNewColumn: boolean): string {
  if (mark === 'overwritten') return OVERWRITE_BG;
  if (mark === 'filled') return FILL_BG;
  if (isNewColumn) return NEW_COLUMN_BG;
  return '';
}

export function ResultPreview({ result, baseColumns, maxRows = 50 }: Props) {
  const rows = result.rows.slice(0, maxRows);
  const baseSet = new Set(baseColumns);
  const marks = result.cellMarks;
  const hasFillMarks = marks.size > 0;

  return (
    <div className="space-y-2">
      <div className="preview-scroll overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              {result.columns.map((c, i) => {
                const isNew = !baseSet.has(c);
                return (
                  <th
                    key={i}
                    className={`px-3 py-2 text-left font-medium ${
                      isNew
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c}
                    {isNew ? <span className="ml-1 text-[10px] uppercase">nuova</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {rows.map((r, ri) => (
              <tr key={ri}>
                {result.columns.map((c, ci) => {
                  const isNew = !baseSet.has(c);
                  const mark = marks.get(`${ri}:${c}`);
                  return (
                    <td key={ci} className={`table-cell ${classForMark(mark, isNew)}`}>
                      {formatCell(r[ci] ?? null)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Nessuna riga.
          </p>
        ) : null}
      </div>
      {hasFillMarks ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${FILL_BG} ring-1 ring-emerald-300 dark:ring-emerald-800`} />
            cella riempita
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${OVERWRITE_BG} ring-1 ring-amber-300 dark:ring-amber-800`} />
            cella sovrascritta
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${NEW_COLUMN_BG} ring-1 ring-brand-300 dark:ring-brand-800`} />
            colonna nuova
          </span>
        </div>
      ) : null}
    </div>
  );
}
