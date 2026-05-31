import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen washi flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-[10px] tracking-[0.4em] uppercase text-stone-500 mb-3">404 · off the map</div>
        <h1 className="font-display text-6xl sm:text-7xl tracking-[-0.03em] text-stone-900 leading-[0.95] mb-4">
          That destination<br />
          <em className="italic" style={{ color: "var(--accent)" }}>doesn’t exist yet</em>.
        </h1>
        <p className="text-stone-600 text-[15px] leading-relaxed mb-8">
          The page you tried doesn’t match anywhere on our globe. Spin back and try a country, or just speak to the concierge.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-stone-900 text-white text-sm font-medium hover:opacity-95 transition"
          >
            ← Back to the globe
          </Link>
          <Link
            href="/plan/japan"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border bg-white text-stone-900 text-sm font-medium hover:bg-stone-50 transition"
            style={{ borderColor: "var(--border)" }}
          >
            Try the Japan showcase
          </Link>
        </div>
      </div>
    </div>
  );
}
