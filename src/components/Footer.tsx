export function Footer({ repoUrl, version }: { repoUrl: string; version: string }) {
  return (
    <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-4">
        ExelCFR v{version} ·{' '}
        <a className="underline hover:text-brand-600" href={repoUrl} target="_blank" rel="noreferrer">
          repository
        </a>{' '}
        · MIT License · I tuoi file restano sul tuo dispositivo.
      </div>
    </footer>
  );
}
