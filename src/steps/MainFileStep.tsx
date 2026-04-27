import { Star } from 'lucide-react';
import type { FileData } from '../types';

interface Props {
  files: FileData[];
  mainFileId: string | null;
  onChange: (id: string) => void;
}

export function MainFileStep({ files, mainFileId, onChange }: Props) {
  if (files.length < 2) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Carica almeno due file per scegliere quello principale.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Il file principale è quello a cui verranno aggiunte nuove colonne. Gli altri saranno
        utilizzati come sorgenti per il CERCA.VERT.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {files.map((f) => {
          const isMain = mainFileId === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onChange(f.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                  isMain
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-900'
                    : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    isMain
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  <Star size={16} fill={isMain ? 'currentColor' : 'none'} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {f.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {f.sheets[f.activeSheetIndex]?.rows.length.toLocaleString('it-IT') ?? 0} righe ·{' '}
                    {f.sheets[f.activeSheetIndex]?.columns.length ?? 0} colonne
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
