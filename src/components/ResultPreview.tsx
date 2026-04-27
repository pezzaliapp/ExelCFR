import { formatCell } from '../lib/format';
import type { MergedResult } from '../types';

interface Props {
  result: MergedResult;
  baseColumns: string[];
  maxRows?: number;
}

export function ResultPreview({ result, baseColumns, maxRows = 50 }: Props) {
  const rows = result.rows.slice(0, maxRows);
  const baseSet = new Set(baseColumns);
  return (
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
                return (
                  <td
                    key={ci}
                    className={`table-cell ${
                      isNew ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''
                    }`}
                  >
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
  );
}
