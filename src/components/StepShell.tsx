import { ChevronDown, Lock } from 'lucide-react';
import { type ReactNode, useState } from 'react';

interface Props {
  number: number;
  title: string;
  subtitle?: string;
  locked?: boolean;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export function StepShell({
  number,
  title,
  subtitle,
  locked = false,
  defaultOpen = true,
  badge,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen && !locked);
  return (
    <section
      className={`card transition ${locked ? 'opacity-60' : ''}`}
      aria-disabled={locked || undefined}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => !locked && setOpen((o) => !o)}
        disabled={locked}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {locked ? <Lock size={16} /> : number}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <ChevronDown
            size={18}
            className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && !locked ? (
        <div className="border-t border-slate-200 px-5 py-5 dark:border-slate-800">{children}</div>
      ) : null}
    </section>
  );
}
