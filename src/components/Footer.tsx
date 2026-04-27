interface Props {
  repoUrl: string;
  version: string;
  onOpenGuide: () => void;
  onOpenDisclaimer: () => void;
}

export function Footer({ repoUrl, version, onOpenGuide, onOpenDisclaimer }: Props) {
  return (
    <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
        <span>ExelCFR v{version}</span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={onOpenGuide}
          className="underline-offset-2 hover:text-brand-600 hover:underline"
        >
          Guida
        </button>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={onOpenDisclaimer}
          className="underline-offset-2 hover:text-brand-600 hover:underline"
        >
          Note legali
        </button>
        <span aria-hidden>·</span>
        <a
          className="underline-offset-2 hover:text-brand-600 hover:underline"
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
        >
          Repository
        </a>
        <span aria-hidden>·</span>
        <span>MIT License</span>
        <span aria-hidden>·</span>
        <span>I tuoi listini restano sul tuo dispositivo.</span>
      </div>
    </footer>
  );
}
