import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type {
  ColumnMapping,
  CompareMode,
  FileData,
  LookupRule,
  MultiMatchMode,
  NoMatchMode,
} from '../types';

interface Props {
  mainFile: FileData;
  sourceFiles: FileData[];
  rules: LookupRule[];
  onChange: (rules: LookupRule[]) => void;
}

const COMPARE_MODE_DESCRIPTIONS: Record<CompareMode, string> = {
  smart:
    "Tollera differenze di tipo (numero/testo), spazi e maiuscole. Mantiene gli zeri iniziali.",
  exact:
    'Confronto rigoroso: i valori devono essere identici, stesso tipo, stesso case.',
  caseInsensitive:
    'Ignora maiuscole/minuscole. Numeri e stringhe restano distinti.',
  trim: 'Rimuove gli spazi iniziali e finali, ma è case-sensitive.',
  normalize:
    'Trim + lowercase + spazi multipli interni collassati a uno solo.',
  numeric:
    'Confronta solo le cifre, ignora zeri iniziali e altri caratteri. Usalo per codici puramente numerici.',
};

function newRule(sourceFileId: string, mainKey: string, sourceKey: string): LookupRule {
  return {
    id: cryptoRandomId(),
    sourceFileId,
    mainKey,
    sourceKey,
    compareMode: 'smart',
    columns: [],
    noMatch: 'empty',
    multiMatch: 'first',
    concatSeparator: '; ',
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `rule-${Math.random().toString(36).slice(2, 10)}`;
}

export function RulesStep({ mainFile, sourceFiles, rules, onChange }: Props) {
  const mainSheet = mainFile.sheets[mainFile.activeSheetIndex];

  const addRule = (sourceFileId?: string) => {
    const src = sourceFiles.find((f) => f.id === sourceFileId) ?? sourceFiles[0];
    if (!src) return;
    const srcSheet = src.sheets[src.activeSheetIndex];
    onChange([...rules, newRule(src.id, mainSheet.columns[0] ?? '', srcSheet.columns[0] ?? '')]);
  };

  const updateRule = (id: string, patch: Partial<LookupRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  if (sourceFiles.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Aggiungi almeno un secondo file (sorgente) per definire le regole di CERCA.VERT.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={() => addRule()}>
          <Plus size={16} /> Aggiungi regola
        </button>
        {sourceFiles.length > 1 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Le regole si applicano in ordine, una dopo l'altra, sulla tabella risultante.
          </span>
        ) : null}
      </div>

      {rules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nessuna regola definita. Clicca «Aggiungi regola» per iniziare.
        </p>
      ) : (
        <ul className="space-y-4">
          {rules.map((rule, i) => (
            <RuleCard
              key={rule.id}
              index={i + 1}
              rule={rule}
              mainFile={mainFile}
              sourceFiles={sourceFiles}
              onChange={(patch) => updateRule(rule.id, patch)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface RuleCardProps {
  index: number;
  rule: LookupRule;
  mainFile: FileData;
  sourceFiles: FileData[];
  onChange: (patch: Partial<LookupRule>) => void;
  onRemove: () => void;
}

function RuleCard({ index, rule, mainFile, sourceFiles, onChange, onRemove }: RuleCardProps) {
  const mainCols = mainFile.sheets[mainFile.activeSheetIndex].columns;
  const source = sourceFiles.find((f) => f.id === rule.sourceFileId) ?? sourceFiles[0];
  const sourceCols = useMemo(() => source.sheets[source.activeSheetIndex].columns, [source]);

  // When source file changes, reset columns / keys to safe defaults
  const switchSource = (id: string) => {
    const src = sourceFiles.find((f) => f.id === id);
    if (!src) return;
    const srcCols = src.sheets[src.activeSheetIndex].columns;
    onChange({
      sourceFileId: id,
      sourceKey: srcCols[0] ?? '',
      columns: [],
    });
  };

  const toggleColumn = (colName: string) => {
    const exists = rule.columns.find((c) => c.sourceColumn === colName);
    if (exists) {
      onChange({ columns: rule.columns.filter((c) => c.sourceColumn !== colName) });
    } else {
      const mapping: ColumnMapping = {
        sourceColumn: colName,
        writeMode: 'newColumn',
        outputName: colName,
        position: { type: 'append' },
      };
      onChange({ columns: [...rule.columns, mapping] });
    }
  };

  const updateMapping = (colName: string, patch: Partial<ColumnMapping>) => {
    onChange({
      columns: rule.columns.map((c) => (c.sourceColumn === colName ? { ...c, ...patch } : c)),
    });
  };

  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            {index}
          </span>
          Regola di lookup
        </div>
        <button type="button" onClick={onRemove} className="btn-danger !py-1">
          <Trash2 size={14} /> Elimina regola
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">File sorgente</label>
          <select
            className="input mt-1"
            value={rule.sourceFileId}
            onChange={(e) => switchSource(e.target.value)}
          >
            {sourceFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Modalità di confronto</label>
          <select
            className="input mt-1"
            value={rule.compareMode}
            onChange={(e) => onChange({ compareMode: e.target.value as CompareMode })}
          >
            <option value="smart">Smart (consigliata)</option>
            <option value="exact">Esatto</option>
            <option value="caseInsensitive">Case-insensitive</option>
            <option value="trim">Trim spazi</option>
            <option value="normalize">Normalizza (trim + lowercase + dedup spazi)</option>
            <option value="numeric">Numerico (solo cifre, ignora zeri iniziali)</option>
          </select>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {COMPARE_MODE_DESCRIPTIONS[rule.compareMode]}
          </p>
        </div>

        <div>
          <label className="field-label">Colonna chiave nel file principale</label>
          <select
            className="input mt-1"
            value={rule.mainKey}
            onChange={(e) => onChange({ mainKey: e.target.value })}
          >
            {mainCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Colonna chiave nel file sorgente</label>
          <select
            className="input mt-1"
            value={rule.sourceKey}
            onChange={(e) => onChange({ sourceKey: e.target.value })}
          >
            {sourceCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="field-label">Colonne da riportare dal sorgente</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {sourceCols
            .filter((c) => c !== rule.sourceKey)
            .map((c) => {
              const selected = !!rule.columns.find((x) => x.sourceColumn === c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleColumn(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selected
                      ? 'border-brand-500 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              );
            })}
        </div>

        {rule.columns.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {rule.columns.map((m) => (
              <MappingEditor
                key={m.sourceColumn}
                mapping={m}
                mainColumns={mainCols}
                onChange={(patch) => updateMapping(m.sourceColumn, patch)}
              />
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">In assenza di corrispondenza</label>
          <select
            className="input mt-1"
            value={rule.noMatch}
            onChange={(e) => onChange({ noMatch: e.target.value as NoMatchMode })}
          >
            <option value="empty">Lascia vuoto</option>
            <option value="na">Scrivi «N/D»</option>
            <option value="custom">Valore personalizzato…</option>
          </select>
          {rule.noMatch === 'custom' ? (
            <input
              className="input mt-2"
              placeholder="Es. — oppure 0 oppure NON TROVATO"
              value={rule.noMatchCustom ?? ''}
              onChange={(e) => onChange({ noMatchCustom: e.target.value })}
            />
          ) : null}
        </div>
        <div>
          <label className="field-label">Corrispondenze multiple</label>
          <select
            className="input mt-1"
            value={rule.multiMatch}
            onChange={(e) => onChange({ multiMatch: e.target.value as MultiMatchMode })}
          >
            <option value="first">Prima corrispondenza</option>
            <option value="last">Ultima corrispondenza</option>
            <option value="concat">Concatena</option>
          </select>
          {rule.multiMatch === 'concat' ? (
            <input
              className="input mt-2"
              placeholder="Separatore (default: «; »)"
              value={rule.concatSeparator ?? '; '}
              onChange={(e) => onChange({ concatSeparator: e.target.value })}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

interface MappingEditorProps {
  mapping: ColumnMapping;
  mainColumns: string[];
  onChange: (patch: Partial<ColumnMapping>) => void;
}

function MappingEditor({ mapping, mainColumns, onChange }: MappingEditorProps) {
  const isFill = mapping.writeMode === 'fillExisting';
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            Da sorgente
          </span>
          {mapping.sourceColumn}
        </span>
        <div
          role="tablist"
          aria-label="Modalità di scrittura"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isFill}
            onClick={() => {
              if (isFill) {
                onChange({
                  writeMode: 'newColumn',
                  outputName: mapping.outputName || mapping.sourceColumn,
                  position: mapping.position ?? { type: 'append' },
                });
              }
            }}
            className={`rounded-md px-3 py-1 transition ${
              !isFill
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-brand-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Aggiungi nuova colonna
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isFill}
            onClick={() => {
              if (!isFill) {
                onChange({
                  writeMode: 'fillExisting',
                  targetColumn: mapping.targetColumn ?? mainColumns[0] ?? '',
                  forceOverwrite: mapping.forceOverwrite ?? false,
                });
              }
            }}
            className={`rounded-md px-3 py-1 transition ${
              isFill
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-brand-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Riempi colonna esistente
          </button>
        </div>
      </div>

      {!isFill ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="field-label">Nome nuova colonna</label>
            <input
              className="input mt-1"
              value={mapping.outputName}
              onChange={(e) => onChange({ outputName: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Posizione</label>
            <PositionPicker
              mapping={mapping}
              baseColumns={mainColumns}
              onChange={(position) => onChange({ position })}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="field-label">Colonna di destinazione</label>
            <select
              className="input mt-1"
              value={mapping.targetColumn ?? ''}
              onChange={(e) => onChange({ targetColumn: e.target.value })}
            >
              <option value="">— seleziona —</option>
              {mainColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={mapping.forceOverwrite === true}
                onChange={(e) => onChange({ forceOverwrite: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Sovrascrivi anche se la cella ha già un valore
            </label>
          </div>
        </div>
      )}
    </li>
  );
}

interface PositionPickerProps {
  mapping: ColumnMapping;
  baseColumns: string[];
  onChange: (position: ColumnMapping['position']) => void;
}

function PositionPicker({ mapping, baseColumns, onChange }: PositionPickerProps) {
  const type = mapping.position.type;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <select
        className="input !py-1"
        value={type}
        onChange={(e) => {
          const v = e.target.value as ColumnMapping['position']['type'];
          if (v === 'append') onChange({ type: 'append' });
          else if (v === 'after') onChange({ type: 'after', columnName: baseColumns[0] ?? '' });
          else onChange({ type: 'index', index: baseColumns.length });
        }}
      >
        <option value="append">In coda</option>
        <option value="after">Dopo colonna…</option>
        <option value="index">All'indice…</option>
      </select>
      {mapping.position.type === 'after' ? (
        <select
          className="input !py-1"
          value={mapping.position.columnName}
          onChange={(e) => onChange({ type: 'after', columnName: e.target.value })}
        >
          {baseColumns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : null}
      {mapping.position.type === 'index' ? (
        <input
          type="number"
          min={0}
          className="input !w-20 !py-1"
          value={mapping.position.index}
          onChange={(e) => onChange({ type: 'index', index: Number(e.target.value) })}
        />
      ) : null}
    </div>
  );
}
