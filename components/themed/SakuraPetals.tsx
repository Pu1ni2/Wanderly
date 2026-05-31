"use client";
import { useMemo } from "react";

interface Props {
  count?: number;
  className?: string;
}

interface Petal {
  left: string;
  delay: string;
  duration: string;
  size: number;
  rotate: string;
  drift: string;
}

export function SakuraPetals({ count = 14, className = "" }: Props) {
  const petals = useMemo<Petal[]>(() =>
    Array.from({ length: count }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 12}s`,
      duration: `${10 + Math.random() * 10}s`,
      size: 8 + Math.floor(Math.random() * 10),
      rotate: `${Math.floor(Math.random() * 360)}deg`,
      drift: `${(Math.random() - 0.5) * 80}px`,
    })),
  [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal absolute -top-6 block"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
            // CSS-only flowery petal shape via radial gradient + border-radius
            width: p.size,
            height: p.size * 1.4,
            background: "radial-gradient(ellipse at 30% 30%, #ffe1ea 0%, #f7c0d2 60%, #e495b0 100%)",
            borderRadius: "50% 10% 50% 10%",
            opacity: 0.85,
            // @ts-expect-error custom CSS var consumed by keyframe via inline style chain
            "--drift": p.drift,
            filter: "drop-shadow(0 1px 1px rgba(189,0,41,0.08))",
          }}
        />
      ))}
    </div>
  );
}
