"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Health {
  openai: boolean;
  unsplash: boolean;
  googlePlaces: boolean;
  amadeus: boolean;
}

interface ApiRow {
  key: keyof Health;
  label: string;
  envVar: string;
  required: boolean;
  powers: string;
  fallback: string;
  getKey: string;
}

const ROWS: ApiRow[] = [
  { key: "openai",       label: "OpenAI",         envVar: "OPENAI_API_KEY",       required: true,  powers: "Every LLM call · realtime voice · TTS", fallback: "Nothing works without this.",                     getKey: "platform.openai.com/api-keys" },
  { key: "unsplash",     label: "Unsplash",       envVar: "UNSPLASH_ACCESS_KEY",  required: false, powers: "Real photos in findImages results",       fallback: "Falls back to placehold.co placeholders.",        getKey: "unsplash.com/developers" },
  { key: "googlePlaces", label: "Google Places",  envVar: "GOOGLE_PLACES_API_KEY",required: false, powers: "Real restaurants + transport data",      fallback: "Ships with a tasteful mock restaurant list.",     getKey: "console.cloud.google.com → APIs → Places" },
  { key: "amadeus",      label: "Amadeus",        envVar: "AMADEUS_CLIENT_ID + ..._SECRET", required: false, powers: "Real flight prices and routes", fallback: "Realistic mock flights ($640–$780).",               getKey: "developers.amadeus.com (Self-Service · free sandbox)" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ApiStatusDrawer({ open, onClose }: Props) {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/30 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-50 overflow-y-auto"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Settings</div>
                  <h2 className="font-display text-2xl tracking-tight text-stone-900 mt-1">API integrations</h2>
                </div>
                <button onClick={onClose} className="text-stone-400 hover:text-stone-900 text-lg w-8 h-8 rounded-full hover:bg-stone-100 transition">
                  ✕
                </button>
              </div>

              <p className="text-[13px] text-stone-600 leading-relaxed mb-6">
                Green = wired up. Gray = falling back to a mock. Only <span className="font-semibold text-stone-900">OpenAI</span> is required;
                everything else has a graceful mock so the demo never breaks.
              </p>

              <div className="space-y-3">
                {ROWS.map((row) => {
                  const live = Boolean(health?.[row.key]);
                  return (
                    <div key={row.key} className="rounded-2xl border border-stone-200 p-4 bg-white">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-300"}`} />
                          <span className="font-display text-[15px] text-stone-900">{row.label}</span>
                          {row.required && (
                            <span className="text-[9px] uppercase tracking-[0.18em] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">required</span>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-[0.18em] ${live ? "text-emerald-700" : "text-stone-400"}`}>
                          {live ? "live" : "mock"}
                        </span>
                      </div>
                      <div className="text-[12px] text-stone-600 mb-1.5">{row.powers}</div>
                      <div className="text-[11px] text-stone-500">
                        Env: <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">{row.envVar}</code>
                      </div>
                      {!live && (
                        <div className="text-[11px] text-stone-500 mt-1.5 leading-snug">
                          <span className="text-stone-700">Without it:</span> {row.fallback}<br />
                          <span className="text-stone-700">Get a key:</span> {row.getKey}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-display text-[15px] text-emerald-900">Open-Meteo + Frankfurter</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">no key</span>
                  </div>
                  <div className="text-[12px] text-emerald-800/90">
                    Real weather + FX rates, free, no signup. Already on for everyone.
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 mt-6 leading-relaxed">
                Keys live in <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">.env.local</code> (gitignored). After adding one, restart the dev server.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
