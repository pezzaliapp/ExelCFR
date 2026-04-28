import {
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Save,
  Search,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { ResultPreview } from '../components/ResultPreview';
import {
  buildDefaultFilename,
  exportCsv,
  exportXlsx,
} from '../lib/exporter';
import { applyRules, normalizeKey, totalRowsTouched, WORKER_ROW_THRESHOLD } from '../lib/lookup';
import type {
  CellValue,
  ColumnMapping,
  ConfigExport,
  FileData,
  LookupRule,
  MergedResult,
} from '../types';
import type { WorkerOutbound } from '../workers/lookup.worker';

interface Props {
  files: FileData[];
  mainFile: FileData;
  rules: LookupRule[];
  onLoadConfig: (rules: LookupRule[], warnings: string[]) => void;
}

export function ExportStep({ files, mainFile, rules, onLoadConfig }: Props) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MergedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [computedSnapshot, setComputedSnapshot] = useState<string | null>(null);

  const [filename, setFilename] = useState<string>(() => buildDefaultFilename(mainFile.label));
  const [csvSeparator, setCsvSeparator] = useState<',' | ';'>(';');
  const [csvBom, setCsvBom] = useState(true);

  // Recompute default filename when main file label changes (and the user hasn't typed)
  const customFilenameRef = useRef(false);
  useEffect(() => {
    if (!customFilenameRef.current) setFilename(buildDefaultFilename(mainFile.label));
  }, [mainFile.label]);

  const filesById = useMemo(
    () => Object.fromEntries(files.map((f) => [f.id, f])) as Record<string, FileData>,
    [files],
  );

  const baseColumns = useMemo(
    () => mainFile.sheets[mainFile.activeSheetIndex].columns,
    [mainFile],
  );

  const totalRows = useMemo(
    () => totalRowsTouched(mainFile, files, rules),
    [mainFile, files, rules],
  );

  // Validate fillExisting mappings: every such mapping must have a targetColumn that
  // currently exists on the main file. We surface this as a non-blocking banner that
  // also disables the "Calcola anteprima" button until fixed.
  const validationErrors = useMemo(() => {
    const issues: string[] = [];
    const mainCols = mainFile.sheets[mainFile.activeSheetIndex].columns;
    for (let ri = 0; ri < rules.length; ri++) {
      const rule = rules[ri];
      for (const m of rule.columns) {
        if (m.writeMode !== 'fillExisting') continue;
        if (!m.targetColumn) {
          issues.push(
            `Regola ${ri + 1}: la colonna sorgente «${m.sourceColumn}» è in modalità "Riempi colonna esistente" ma non ha una colonna di destinazione.`,
          );
        } else if (!mainCols.includes(m.targetColumn)) {
          issues.push(
            `Regola ${ri + 1}: la colonna di destinazione «${m.targetColumn}» non esiste più nel file principale.`,
          );
        }
      }
    }
    return issues;
  }, [rules, mainFile]);

  // Snapshot of inputs at compute time. Used to detect when the user has
  // changed configuration after running and the preview is therefore stale.
  const currentSnapshot = useMemo(
    () => JSON.stringify({ mainFileId: mainFile.id, rules }),
    [mainFile.id, rules],
  );
  const isStale = result !== null && computedSnapshot !== null && computedSnapshot !== currentSnapshot;

  const run = async () => {
    setRunning(true);
    setProgress(0);
    setError(null);
    try {
      if (totalRows >= WORKER_ROW_THRESHOLD && typeof Worker !== 'undefined') {
        const r = await runInWorker({ mainFile, filesById, rules }, setProgress);
        setResult(r);
      } else {
        const r = applyRules({
          mainFile,
          filesById,
          rules,
          onProgress: (f) => setProgress(f),
        });
        setResult(r);
      }
      setProgress(1);
      setComputedSnapshot(currentSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const downloadNoMatchCsv = (rule: LookupRule) => {
    const src = files.find((f) => f.id === rule.sourceFileId);
    if (!src) return;
    const srcSheet = src.sheets[src.activeSheetIndex];
    const srcKeyIdx = srcSheet.columns.indexOf(rule.sourceKey);
    const mainSheet = mainFile.sheets[mainFile.activeSheetIndex];
    const mainKeyIdx = mainSheet.columns.indexOf(rule.mainKey);
    if (srcKeyIdx === -1 || mainKeyIdx === -1) return;

    const sourceKeys = new Set<string>();
    for (const r of srcSheet.rows) {
      const k = normalizeKey(r[srcKeyIdx] ?? null, rule.compareMode);
      if (k !== '') sourceKeys.add(k);
    }

    const header = ['#', `Chiave (${rule.mainKey}) non trovata`, ...mainSheet.columns];
    const noMatchRows: string[][] = [];
    for (let i = 0; i < mainSheet.rows.length; i++) {
      const row = mainSheet.rows[i];
      const key = normalizeKey(row[mainKeyIdx] ?? null, rule.compareMode);
      const matched = key !== '' && sourceKeys.has(key);
      if (matched) continue;
      noMatchRows.push([
        String(i + 1),
        cellToPlainString(row[mainKeyIdx]),
        ...row.map(cellToPlainString),
      ]);
    }

    const sep = ';';
    const lines = [header, ...noMatchRows].map((r) =>
      r.map((cell) => csvEscape(cell, sep)).join(sep),
    );
    const text = '﻿' + lines.join('\r\n');

    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const baseName = mainFile.label.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_') || 'principale';
    const sourceTag =
      rules.length > 1 ? `_${(src.label || 'sorgente').replace(/[^\w-]+/g, '_')}` : '';
    const fname = `ExelCFR_no-match_${baseName}${sourceTag}_${stamp}.csv`;

    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownloadXlsx = () => {
    if (!result) return;
    exportXlsx(result, { filename });
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    exportCsv(result, { filename, separator: csvSeparator, withBOM: csvBom });
  };

  const handleSaveConfig = () => {
    const exportObj: ConfigExport = {
      version: 1,
      mainFileLabel: mainFile.label,
      rules: rules.map((r) => ({
        ...r,
        sourceFileLabel: files.find((f) => f.id === r.sourceFileId)?.label ?? '',
      })),
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExelCFR_config_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLoadConfigFile = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt) as ConfigExport;
      if (parsed.version !== 1 || !Array.isArray(parsed.rules)) {
        throw new Error('Formato non riconosciuto');
      }
      const warnings: string[] = [];
      const remapped: LookupRule[] = [];
      const mainCols = mainFile.sheets[mainFile.activeSheetIndex].columns;
      for (const r of parsed.rules) {
        const candidate =
          files.find((f) => f.label === r.sourceFileLabel) ??
          files.find((f) => f.id !== mainFile.id);
        if (!candidate) {
          warnings.push(`Sorgente «${r.sourceFileLabel}» non trovata fra i file caricati.`);
          continue;
        }
        const srcCols = candidate.sheets[candidate.activeSheetIndex].columns;
        if (!mainCols.includes(r.mainKey)) {
          warnings.push(
            `La colonna chiave «${r.mainKey}» non esiste nel file principale (regola saltata).`,
          );
          continue;
        }
        if (!srcCols.includes(r.sourceKey)) {
          warnings.push(
            `La colonna chiave «${r.sourceKey}» non esiste in «${candidate.label}» (regola saltata).`,
          );
          continue;
        }
        const normalizedColumns: ColumnMapping[] = [];
        for (const c of r.columns) {
          if (!srcCols.includes(c.sourceColumn)) {
            warnings.push(
              `Colonna «${c.sourceColumn}» mancante in «${candidate.label}» — ignorata.`,
            );
            continue;
          }
          const normalized = normalizeMapping(c, mainCols);
          if (normalized.writeMode === 'fillExisting' && !normalized.targetColumn) {
            warnings.push(
              `Colonna «${c.sourceColumn}» in modalità "Riempi colonna esistente" senza destinazione — completala dopo il caricamento.`,
            );
          } else if (
            normalized.writeMode === 'fillExisting' &&
            normalized.targetColumn &&
            !mainCols.includes(normalized.targetColumn)
          ) {
            warnings.push(
              `Colonna di destinazione «${normalized.targetColumn}» non presente nel file principale — verifica la regola.`,
            );
          }
          normalizedColumns.push(normalized);
        }
        remapped.push({
          ...r,
          sourceFileId: candidate.id,
          columns: normalizedColumns,
        });
      }
      onLoadConfig(remapped, warnings);
    } catch (err) {
      setError(`Configurazione non valida: ${err instanceof Error ? err.message : 'errore'}`);
    }
  };

  const blockedByValidation = validationErrors.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={run}
          disabled={running || blockedByValidation}
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {running ? 'Elaborazione…' : 'Calcola anteprima'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleSaveConfig}>
          <Save size={16} /> Salva configurazione
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} /> Carica configurazione
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleLoadConfigFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {validationErrors.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">Completa la configurazione prima di esportare:</p>
          <ul className="mt-1 list-disc pl-5">
            {validationErrors.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {isStale ? (
        <div className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          Configurazione cambiata dopo l’ultimo calcolo. Ricalcola l’anteprima per aggiornare i
          risultati.
        </div>
      ) : null}

      {running ? <ProgressBar value={progress} label="Esecuzione regole" /> : null}

      {error ? (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.stats.map((s) => {
              const rule = rules.find((r) => r.id === s.ruleId);
              const label = rule
                ? `${mainFile.label} ⟵ ${files.find((f) => f.id === rule.sourceFileId)?.label ?? '?'}`
                : 'Regola';
              const fmt = (n: number) => n.toLocaleString('it-IT');
              const hasFillStats = typeof s.filled === 'number';
              return (
                <div
                  key={s.ruleId}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="truncate font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {fmt(s.processed)} righe processate
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-300">
                      ✓ {fmt(s.matches)} match
                    </span>
                    <span className="text-rose-600 dark:text-rose-300">
                      ✗ {fmt(s.noMatches)} senza match
                    </span>
                  </div>
                  {hasFillStats ? (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-300">
                        ▣ {fmt(s.filled ?? 0)} celle riempite
                      </span>
                      <span className="text-amber-600 dark:text-amber-300">
                        ✎ {fmt(s.overwritten ?? 0)} celle sovrascritte
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        – {fmt(s.untouched ?? 0)} celle lasciate intatte
                      </span>
                    </div>
                  ) : null}
                  {rule && s.noMatches > 0 ? (
                    <button
                      type="button"
                      onClick={() => downloadNoMatchCsv(rule)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      <Search size={12} /> Scarica elenco no-match (.csv)
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Anteprima prime 50 righe — colonne aggiunte evidenziate, celle riempite in verde, celle
              sovrascritte in arancione.
            </p>
            <ResultPreview result={result} baseColumns={baseColumns} maxRows={50} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Esporta il risultato
            </h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Nome file</label>
                <input
                  className="input mt-1"
                  value={filename}
                  onChange={(e) => {
                    customFilenameRef.current = true;
                    setFilename(e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="field-label">Opzioni CSV</label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    Separatore
                    <select
                      className="input !w-auto !py-1"
                      value={csvSeparator}
                      onChange={(e) => setCsvSeparator(e.target.value as ',' | ';')}
                    >
                      <option value=";">; (Excel europeo)</option>
                      <option value=",">, (standard)</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={csvBom}
                      onChange={(e) => setCsvBom(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    UTF-8 con BOM
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={handleDownloadXlsx}>
                <FileSpreadsheet size={16} />
                <Download size={14} /> Scarica Excel (.xlsx)
              </button>
              <button type="button" className="btn-secondary" onClick={handleDownloadCsv}>
                <FileText size={16} />
                <Download size={14} /> Scarica CSV
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configura almeno una regola e clicca «Calcola anteprima» per vedere il risultato qui.
        </p>
      )}
    </div>
  );
}

function cellToPlainString(v: CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toLocaleDateString('it-IT');
  return String(v);
}

function csvEscape(v: string, sep: string): string {
  const needsQuote = v.includes(sep) || v.includes('"') || v.includes('\n') || v.includes('\r');
  return needsQuote ? '"' + v.replace(/"/g, '""') + '"' : v;
}

/**
 * Backward-compatible normalizer for ColumnMapping loaded from a saved JSON config.
 * Pre-0.2.0 configs do not carry `writeMode` and must default to 'newColumn'.
 */
function normalizeMapping(c: Partial<ColumnMapping>, mainColumns: string[]): ColumnMapping {
  const writeMode: ColumnMapping['writeMode'] =
    c.writeMode === 'fillExisting' ? 'fillExisting' : 'newColumn';
  const sourceColumn = c.sourceColumn ?? '';
  return {
    sourceColumn,
    writeMode,
    outputName: c.outputName ?? sourceColumn,
    position: c.position ?? { type: 'append' },
    targetColumn:
      writeMode === 'fillExisting'
        ? (c.targetColumn ?? mainColumns[0] ?? undefined)
        : c.targetColumn,
    forceOverwrite: c.forceOverwrite === true,
  };
}

function runInWorker(
  payload: {
    mainFile: FileData;
    filesById: Record<string, FileData>;
    rules: LookupRule[];
  },
  onProgress: (n: number) => void,
): Promise<MergedResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/lookup.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
      const m = e.data;
      if (m.type === 'progress') onProgress(m.fraction);
      else if (m.type === 'done') {
        resolve(m.result);
        worker.terminate();
      } else if (m.type === 'error') {
        reject(new Error(m.message));
        worker.terminate();
      }
    };
    worker.onerror = (ev) => {
      reject(new Error(ev.message || 'Errore nel worker'));
      worker.terminate();
    };
    worker.postMessage({ type: 'run', payload });
  });
}
