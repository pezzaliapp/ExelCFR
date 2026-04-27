import { FileSpreadsheet, FileText, Loader2, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePreview } from '../components/FilePreview';
import { formatBytes } from '../lib/format';
import { parseFile } from '../lib/parser';
import type { FileData } from '../types';

interface Props {
  files: FileData[];
  rawFiles: Map<string, File>;
  onAdd: (entries: Array<{ data: FileData; raw: File }>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<FileData>) => void;
  onError: (msg: string) => void;
  onWarn: (msg: string) => void;
}

const ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt', '.tsv'],
};

const SOFT_SIZE_LIMIT = 100 * 1024 * 1024; // 100 MB
const SOFT_ROW_LIMIT = 200_000;

export function UploadStep({
  files,
  rawFiles,
  onAdd,
  onRemove,
  onUpdate,
  onError,
  onWarn,
}: Props) {
  const [parsing, setParsing] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setParsing(true);
      const additions: Array<{ data: FileData; raw: File }> = [];
      for (const file of accepted) {
        try {
          if (file.size > SOFT_SIZE_LIMIT) {
            onWarn(
              `«${file.name}» supera 100 MB: l'elaborazione potrebbe richiedere tempo o esaurire la memoria del browser.`,
            );
          }
          const data = await parseFile(file, true);
          const totalRows = data.sheets.reduce((n, s) => n + s.rows.length, 0);
          if (totalRows > SOFT_ROW_LIMIT) {
            onWarn(
              `«${file.name}» contiene ${totalRows.toLocaleString('it-IT')} righe: l'elaborazione userà un Web Worker ma potrebbe essere lenta.`,
            );
          }
          additions.push({ data, raw: file });
        } catch (err) {
          onError(
            `Impossibile leggere «${file.name}»: ${err instanceof Error ? err.message : 'errore sconosciuto'}`,
          );
        }
      }
      if (additions.length > 0) onAdd(additions);
      setParsing(false);
    },
    [onAdd, onError, onWarn],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    noClick: true,
  });

  const handleHeaderToggle = useCallback(
    async (file: FileData) => {
      const raw = rawFiles.get(file.id);
      if (!raw) {
        onError('File originale non disponibile per la rilettura.');
        return;
      }
      try {
        const next = await parseFile(raw, !file.hasHeader);
        onUpdate(file.id, {
          sheets: next.sheets,
          hasHeader: !file.hasHeader,
          activeSheetIndex: Math.min(file.activeSheetIndex, next.sheets.length - 1),
          csvSeparator: next.csvSeparator,
        });
      } catch (err) {
        onError(
          `Errore di rilettura: ${err instanceof Error ? err.message : 'sconosciuto'}`,
        );
      }
    },
    [rawFiles, onUpdate, onError],
  );

  return (
    <div className="space-y-5">
      <div
        {...getRootProps({
          className: `flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
          }`,
        })}
        onClick={open}
      >
        <input {...getInputProps()} />
        <UploadCloud size={32} className="mb-3 text-brand-500" />
        <p className="text-base font-medium text-slate-800 dark:text-slate-100">
          Trascina qui i tuoi file o clicca per selezionarli
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Supportati: .xlsx, .xls, .csv, .tsv, .txt — più file insieme.
        </p>
        {parsing ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300">
            <Loader2 size={14} className="animate-spin" /> Lettura in corso…
          </p>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Carica almeno due file per cominciare a configurare il CERCA.VERT.
        </p>
      ) : (
        <ul className="space-y-3">
          {files.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              onRemove={() => onRemove(f.id)}
              onRelabel={(label) => onUpdate(f.id, { label })}
              onSwitchSheet={(idx) => onUpdate(f.id, { activeSheetIndex: idx })}
              onToggleHeader={() => handleHeaderToggle(f)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface FileCardProps {
  file: FileData;
  onRemove: () => void;
  onRelabel: (label: string) => void;
  onSwitchSheet: (idx: number) => void;
  onToggleHeader: () => void;
}

function FileCard({ file, onRemove, onRelabel, onSwitchSheet, onToggleHeader }: FileCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(file.label);
  const sheet = file.sheets[file.activeSheetIndex];
  const rowCount = sheet?.rows.length ?? 0;
  const colCount = sheet?.columns.length ?? 0;

  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-300">
            {file.kind === 'csv' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
          </div>
          <div className="min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  className="input !py-1"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-secondary !py-1"
                  onClick={() => {
                    onRelabel(draftLabel.trim() || file.fileName);
                    setEditing(false);
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {file.label}
                </h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-brand-600"
                  onClick={() => {
                    setDraftLabel(file.label);
                    setEditing(true);
                  }}
                  aria-label="Rinomina"
                  title="Rinomina"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {file.fileName} · {formatBytes(file.size)} · {rowCount.toLocaleString('it-IT')} righe ·{' '}
              {colCount} colonne
              {file.kind === 'csv' && file.csvSeparator
                ? ` · separatore "${file.csvSeparator === '\t' ? 'TAB' : file.csvSeparator}"`
                : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="btn-danger !py-1"
          aria-label={`Rimuovi ${file.label}`}
        >
          <Trash2 size={14} /> Rimuovi
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {file.sheets.length > 1 ? (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>Foglio</span>
            <select
              className="input !py-1"
              value={file.activeSheetIndex}
              onChange={(e) => onSwitchSheet(Number(e.target.value))}
            >
              {file.sheets.map((s, i) => (
                <option key={i} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={file.hasHeader}
            onChange={onToggleHeader}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Prima riga è intestazione
        </label>
      </div>

      <div className="mt-4">
        <FilePreview sheet={sheet} maxRows={10} />
      </div>
    </li>
  );
}
