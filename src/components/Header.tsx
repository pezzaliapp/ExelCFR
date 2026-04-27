import { BookOpen, Github, ShieldCheck } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';

interface Props {
  repoUrl: string;
  onOpenGuide: () => void;
}

export function Header({ repoUrl, onOpenGuide }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-soft">
            CFR
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              ExelCFR
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CERCA.VERT tra listini, direttamente nel browser
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
            <ShieldCheck size={14} /> 100% locale, nessun upload
          </span>
          <button
            type="button"
            onClick={onOpenGuide}
            className="btn-ghost h-9 !px-2 sm:!px-3"
            aria-label="Apri la guida"
            title="Guida"
          >
            <BookOpen size={18} />
            <span className="hidden text-sm font-medium sm:inline">Guida</span>
          </button>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost h-9 w-9 !p-0"
            aria-label="Apri il repository su GitHub"
            title="Repository"
          >
            <Github size={18} />
          </a>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
