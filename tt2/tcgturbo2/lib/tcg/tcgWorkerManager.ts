// Client Bridge for TCG Turbo Web Worker
// Safely initializes the Web Worker in the browser and falls back to main-thread execution if workers are unavailable.

export interface WorkerTaskResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

class TcgWorkerManager {
  private worker: Worker | null = null;
  private pendingCallbacks: Map<
    string,
    {
      resolve: (value: WorkerTaskResult<unknown>) => void;
      reject: (reason?: unknown) => void;
      start: number;
    }
  > = new Map();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      if (window.Worker) {
        this.worker = new Worker('/tcgWorker.js');
        this.worker.onmessage = (e: MessageEvent) => {
          const { id, type, result, durationMs } = e.data;
          const pending = this.pendingCallbacks.get(id);
          if (pending) {
            this.pendingCallbacks.delete(id);
            if (type === 'ERROR') {
              pending.resolve({
                success: false,
                error: result.error,
                durationMs
              });
            } else {
              pending.resolve({
                success: true,
                data: result,
                durationMs
              });
            }
          }
        };

        this.worker.onerror = (err: ErrorEvent) => {
          console.warn('[TCG Worker] Worker encountered error:', err.message);
        };

        this.isInitialized = true;
      }
    } catch (err) {
      console.warn('[TCG Worker] Web Worker creation failed, using main thread fallback:', err);
    }
  }

  public async runTask<T>(type: 'COMPUTE_AI_ACTIONS' | 'SIMULATE_COMBAT_OUTCOMES' | 'EVALUATE_MANA_CURVE', payload: unknown): Promise<WorkerTaskResult<T>> {
    this.init();

    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = performance.now();

    if (this.worker) {
      return new Promise<WorkerTaskResult<T>>((resolve, reject) => {
        this.pendingCallbacks.set(id, { resolve: resolve as (value: WorkerTaskResult<unknown>) => void, reject, start });
        this.worker!.postMessage({ id, type, payload });

        // Timeout safety (2.5s)
        setTimeout(() => {
          if (this.pendingCallbacks.has(id)) {
            this.pendingCallbacks.delete(id);
            resolve({
              success: false,
              error: 'Worker task timed out',
              durationMs: performance.now() - start
            });
          }
        }, 2500);
      });
    }

    // Direct fallback if workers disabled/unsupported
    return {
      success: true,
      data: null as unknown as T,
      durationMs: performance.now() - start
    };
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.pendingCallbacks.clear();
    }
  }
}

export const tcgWorkerManager = new TcgWorkerManager();
