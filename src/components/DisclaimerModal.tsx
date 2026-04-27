import { ShieldAlert, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export const DISCLAIMER_VERSION = '1.0';
export const DISCLAIMER_STORAGE_KEY = 'exelcfr_disclaimer_accepted';

export interface StoredDisclaimer {
  version: string;
  acceptedAt: string;
}

/** Read the stored acceptance, returns null if missing or unreadable. */
export function readDisclaimer(): StoredDisclaimer | null {
  try {
    const raw = window.localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDisclaimer>;
    if (!parsed || typeof parsed.version !== 'string' || typeof parsed.acceptedAt !== 'string') {
      return null;
    }
    return { version: parsed.version, acceptedAt: parsed.acceptedAt };
  } catch {
    return null;
  }
}

export function writeDisclaimer(version: string): StoredDisclaimer {
  const payload: StoredDisclaimer = { version, acceptedAt: new Date().toISOString() };
  window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

interface Props {
  open: boolean;
  /** 'accept' shows checkbox + Continue (cannot be dismissed). 'readonly' shows Close. */
  mode: 'accept' | 'readonly';
  onAccept?: () => void;
  onClose?: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DisclaimerModal({ open, mode, onAccept, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const [accepted, setAccepted] = useState(false);

  // Reset checkbox each time the modal opens in accept mode
  useEffect(() => {
    if (open && mode === 'accept') setAccepted(false);
  }, [open, mode]);

  // Focus management + key handling
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the heading first so the screen reader announces it
    const heading = dialog.querySelector<HTMLElement>('[data-disclaimer-title]');
    heading?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        const focusable = Array.from(
          dialog!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => !el.hasAttribute('aria-hidden'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (active === first || active === heading)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape' && mode === 'readonly') {
        onClose?.();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    // Lock scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  const isAccept = mode === 'accept';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        // In readonly mode, allow backdrop close. In accept mode, require explicit consent.
        if (e.target === e.currentTarget && !isAccept) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className="card relative w-full max-w-[480px] overflow-hidden border border-slate-200 shadow-2xl dark:border-slate-700"
      >
        <div className="flex items-start gap-3 border-b border-slate-200 bg-amber-50 px-5 py-4 dark:border-slate-800 dark:bg-amber-950/30">
          <ShieldAlert className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-300" size={22} />
          <h2
            id={titleId}
            data-disclaimer-title
            tabIndex={-1}
            className="text-base font-semibold text-slate-900 outline-none dark:text-white"
          >
            ⚠️ Note legali e limitazioni di responsabilità
          </h2>
          {!isAccept ? (
            <button
              type="button"
              onClick={() => onClose?.()}
              className="ml-auto -m-1 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Chiudi"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div
          id={descId}
          className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
        >
          <p>
            ExelCFR è uno strumento gratuito fornito «così com'è», senza alcuna garanzia di
            funzionamento, accuratezza dei risultati o adeguatezza a uno scopo specifico.
          </p>
          <p>
            <strong>Verifica sempre i risultati.</strong> L'app esegue operazioni di abbinamento
            (CERCA.VERT) su dati che fornisci tu. Errori nei file di partenza, codici scritti in
            modo diverso, configurazioni non corrette o casi non previsti possono produrre
            risultati inattesi. Prima di usare il file esportato per scopi commerciali, contabili o
            decisionali, <strong>controllalo manualmente</strong>.
          </p>
          <p>
            <strong>Fai un backup dei tuoi listini originali</strong> prima di sovrascrivere
            colonne esistenti o di esportare file con lo stesso nome.
          </p>
          <p>
            L'autore e i contributori del progetto <strong>non si assumono alcuna responsabilità</strong>{' '}
            per perdite economiche, errori di prezzo, problemi con fornitori o clienti, o altri
            danni diretti o indiretti derivanti dall'uso o dal malfunzionamento di ExelCFR.
          </p>
          <p>
            <strong>Privacy</strong>: l'app è interamente client-side, i tuoi file restano sul tuo
            dispositivo e non vengono inviati a nessun server. Non c'è raccolta di dati personali
            né cookie di tracciamento.
          </p>
          <p>Continuando dichiari di aver letto, compreso e accettato queste condizioni.</p>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          {isAccept ? (
            <>
              <label className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Ho letto e accetto le note legali</span>
              </label>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!accepted}
                  onClick={() => onAccept?.()}
                >
                  Continua
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <button type="button" className="btn-secondary" onClick={() => onClose?.()}>
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
