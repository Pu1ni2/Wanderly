"use client";
import { useState } from "react";
import { ApiStatusDrawer } from "./ApiStatusDrawer";

export function ApiStatusNavPill() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12px] tracking-tight text-stone-700 hover:text-stone-900 transition px-3 py-1.5 rounded-full border border-stone-200 bg-white"
        aria-label="API status"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        API status
      </button>
      <ApiStatusDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
