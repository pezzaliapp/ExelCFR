/// <reference lib="webworker" />
import { applyRules } from '../lib/lookup';
import type { FileData, LookupRule, MergedResult } from '../types';

interface RunMessage {
  type: 'run';
  payload: {
    mainFile: FileData;
    filesById: Record<string, FileData>;
    rules: LookupRule[];
  };
}

interface ProgressMessage {
  type: 'progress';
  fraction: number;
}

interface DoneMessage {
  type: 'done';
  result: MergedResult;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WorkerOutbound = ProgressMessage | DoneMessage | ErrorMessage;
export type WorkerInbound = RunMessage;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  if (msg.type !== 'run') return;
  try {
    const result = applyRules({
      mainFile: msg.payload.mainFile,
      filesById: msg.payload.filesById,
      rules: msg.payload.rules,
      onProgress: (fraction) => {
        const out: WorkerOutbound = { type: 'progress', fraction };
        ctx.postMessage(out);
      },
    });
    const out: WorkerOutbound = { type: 'done', result };
    ctx.postMessage(out);
  } catch (err) {
    const out: WorkerOutbound = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(out);
  }
});
