import { useCallback, useMemo, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { StepShell } from './components/StepShell';
import { ToastStack, type ToastItem, type ToastKind } from './components/Toast';
import { ExportStep } from './steps/ExportStep';
import { MainFileStep } from './steps/MainFileStep';
import { RulesStep } from './steps/RulesStep';
import { UploadStep } from './steps/UploadStep';
import type { FileData, LookupRule } from './types';

const REPO_URL = 'https://github.com/pezzaliapp/ExelCFR';
const VERSION = '0.2.0';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const rawFilesRef = useRef<Map<string, File>>(new Map());
  const [mainFileId, setMainFileId] = useState<string | null>(null);
  const [rules, setRules] = useState<LookupRule[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addFiles = useCallback(
    (entries: Array<{ data: FileData; raw: File }>) => {
      setFiles((prev) => {
        const next = [...prev, ...entries.map((e) => e.data)];
        // First file uploaded becomes the default main file
        setMainFileId((cur) => cur ?? entries[0]?.data.id ?? null);
        return next;
      });
      for (const e of entries) rawFilesRef.current.set(e.data.id, e.raw);
      pushToast('success', `Caricato${entries.length > 1 ? 'i' : ''} ${entries.length} file.`);
    },
    [pushToast],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    rawFilesRef.current.delete(id);
    setMainFileId((cur) => (cur === id ? null : cur));
    setRules((prev) => prev.filter((r) => r.sourceFileId !== id));
  }, []);

  const updateFile = useCallback((id: string, patch: Partial<FileData>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const mainFile = useMemo(
    () => files.find((f) => f.id === mainFileId) ?? null,
    [files, mainFileId],
  );

  const sourceFiles = useMemo(
    () => files.filter((f) => f.id !== mainFileId),
    [files, mainFileId],
  );

  const canConfigureRules = !!mainFile && sourceFiles.length > 0;
  const canExport =
    canConfigureRules && rules.length > 0 && rules.every((r) => r.columns.length > 0);

  // When the main file changes, prune rules that no longer reference valid columns
  const handleSetMain = (id: string) => {
    setMainFileId(id);
    setRules((prev) => {
      const newMain = files.find((f) => f.id === id);
      if (!newMain) return prev;
      const cols = newMain.sheets[newMain.activeSheetIndex].columns;
      return prev
        .filter((r) => r.sourceFileId !== id) // can't be both main + source
        .map((r) => ({
          ...r,
          mainKey: cols.includes(r.mainKey) ? r.mainKey : cols[0] ?? '',
        }));
    });
  };

  const handleLoadConfig = (loaded: LookupRule[], warnings: string[]) => {
    setRules(loaded);
    if (warnings.length > 0) {
      for (const w of warnings) pushToast('warning', w);
    } else {
      pushToast('success', `Configurazione caricata: ${loaded.length} regole.`);
    }
  };

  return (
    <div className="min-h-full">
      <Header repoUrl={REPO_URL} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Intro />
        <StepShell
          number={1}
          title="Carica i file"
          subtitle={
            files.length === 0
              ? 'Excel o CSV — uno o più, drag & drop o sfoglia.'
              : `${files.length} file caricati`
          }
        >
          <UploadStep
            files={files}
            rawFiles={rawFilesRef.current}
            onAdd={addFiles}
            onRemove={removeFile}
            onUpdate={updateFile}
            onError={(m) => pushToast('error', m)}
            onWarn={(m) => pushToast('warning', m)}
          />
        </StepShell>

        <StepShell
          number={2}
          title="Scegli il file principale"
          subtitle={
            mainFile ? `Principale: ${mainFile.label}` : 'Carica almeno due file per scegliere'
          }
          locked={files.length < 2}
        >
          <MainFileStep files={files} mainFileId={mainFileId} onChange={handleSetMain} />
        </StepShell>

        <StepShell
          number={3}
          title="Configura le regole di lookup"
          subtitle={
            rules.length === 0
              ? 'Aggiungi una regola per ogni colonna che vuoi importare.'
              : `${rules.length} regola/e definita/e`
          }
          locked={!canConfigureRules}
        >
          {mainFile ? (
            <RulesStep
              mainFile={mainFile}
              sourceFiles={sourceFiles}
              rules={rules}
              onChange={setRules}
            />
          ) : null}
        </StepShell>

        <StepShell
          number={4}
          title="Anteprima ed esporta"
          subtitle={
            canExport
              ? 'Calcola il risultato e scarica come Excel o CSV.'
              : 'Definisci almeno una regola con una colonna selezionata.'
          }
          locked={!canExport}
        >
          {mainFile && canExport ? (
            <ExportStep
              files={files}
              mainFile={mainFile}
              rules={rules}
              onLoadConfig={handleLoadConfig}
            />
          ) : null}
        </StepShell>
      </main>
      <Footer repoUrl={REPO_URL} version={VERSION} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function Intro() {
  return (
    <section className="card px-5 py-5">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Confronta e unisci listini Excel/CSV con CERCA.VERT
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Carica due o più listini, scegli il file principale, definisci le regole di lookup e
        scarica il risultato. Tutto avviene <strong>nel tuo browser</strong>: i file non vengono
        mai inviati a server.
      </p>
    </section>
  );
}

export default App;
