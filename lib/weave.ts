import * as weave from "weave";

/**
 * Initialize Weave exactly once per process. Serverless routes can re-import
 * modules between cold starts; the cached promise prevents duplicate init.
 *
 * If WANDB_API_KEY is missing, Weave logs a warning and no-ops — the app
 * still runs in dev without W&B configured.
 */
let initPromise: Promise<unknown> | null = null;

export function ensureWeave(): Promise<unknown> {
  if (!initPromise) {
    const project = process.env.WANDB_PROJECT ?? "wanderly";
    initPromise = weave.init(project).catch((err) => {
      console.warn("[weave] init failed, continuing without tracing:", String(err).slice(0, 300));
      return null;
    });
  }
  return initPromise;
}
