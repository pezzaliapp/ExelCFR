import { formatCell } from '../lib/format';
import type { ParsedSheet } from '../types';

export function FilePreview({ sheet, maxRows = 10 }: { sheet: ParsedSheet; maxRows?: number }) {
  const rows = sheet.rows.slice(0, maxRows);
  if (sheet.columns.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nessun dato da mostrare per questo foglio.
      </p>
    );
  }
  return (
    <div className="preview-scroll overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            {sheet.columns.map((c, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {sheet.columns.map((_, ci) => (
                <td key={ci} className="table-cell">
                  {formatCell(r[ci] ?? null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Il foglio non contiene righe di dati.
        </p>
      ) : null}
    </div>
  );
}
