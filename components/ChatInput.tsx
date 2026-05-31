"use client";
import { useRef, useState } from "react";

interface Props {
  onSubmit: (data: { query: string; budgetUSD?: number; imageDataUrl?: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  accent?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder, accent = "#bd0029" }: Props) {
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
    <div
      className="rounded-3xl border bg-white/85 backdrop-blur-xl p-5 transition"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
    >
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Try: "Plan a 4-day trip to Tokyo for 2 people, budget $2500, with local food."'}
        rows={3}
        className="w-full resize-none bg-transparent outline-none text-[15px] leading-relaxed placeholder:text-[color:var(--ink-faint)]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
      />
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[color:var(--ink-faint)]">Budget</span>
          <div className="flex items-center bg-[color:var(--bg)] rounded-full px-3 py-1.5 border" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm text-[color:var(--ink-soft)]">$</span>
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
          className="text-sm px-3.5 py-1.5 rounded-full border bg-white hover:bg-[color:var(--bg)] transition"
          style={{ borderColor: "var(--border)" }}
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
            <img src={imageDataUrl} alt="" className="h-10 w-14 object-cover rounded-md border" style={{ borderColor: "var(--border)" }} />
            <button
              type="button"
              onClick={() => setImageDataUrl(undefined)}
              className="text-xs text-[color:var(--ink-faint)] hover:text-[color:var(--ink)]"
            >
              remove
            </button>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={submit}
          disabled={disabled}
          className="text-sm font-medium px-5 py-2.5 rounded-full text-white shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: accent }}
        >
          {disabled ? "Planning…" : "Plan my trip →"}
        </button>
      </div>
    </div>
  );
}
