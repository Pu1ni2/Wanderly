"use client";
import { useRef, useState } from "react";

interface Props {
  onSubmit: (data: { query: string; budgetUSD?: number; imageDataUrl?: string }) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  function pickImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function submit() {
    if (disabled) return;
    if (!query.trim() && !imageDataUrl) return;
    onSubmit({
      query: query.trim(),
      budgetUSD: budget ? Number(budget) : undefined,
      imageDataUrl,
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Try: "Plan a 4-day trip to Doha for 2 people, budget $2500, with local food."'
        rows={3}
        className="w-full resize-none bg-transparent outline-none text-base placeholder:text-neutral-400"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
      />
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Budget</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2 py-1">
            <span className="text-sm text-neutral-500">$</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="2500"
              className="w-20 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        >
          {imageDataUrl ? "Replace photo" : "Plan from a photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
        />

        {imageDataUrl && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="" className="h-10 w-14 object-cover rounded-md border border-neutral-200 dark:border-neutral-700" />
            <button
              type="button"
              onClick={() => setImageDataUrl(undefined)}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              remove
            </button>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={submit}
          disabled={disabled}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {disabled ? "Planning…" : "Plan my trip"}
        </button>
      </div>
    </div>
  );
}
