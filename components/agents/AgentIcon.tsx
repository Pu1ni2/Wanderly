"use client";
import type { AgentIconKey } from "./registry";

interface Props {
  icon: AgentIconKey;
  color: string;
  size?: number;
  className?: string;
}

/**
 * Each agent gets a small hand-drawn SVG mark in a 28×28 viewport.
 * Strokes use currentColor; fills are tinted with the passed `color`.
 */
export function AgentIcon({ icon, color, size = 28, className = "" }: Props) {
  const common = {
    viewBox: "0 0 28 28",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (icon) {
    case "compass":
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="9.5" />
          <path d="M14 6.5L17 14L14 21.5L11 14Z" fill={color} stroke={color} />
          <circle cx="14" cy="14" r="1.4" fill="#ffffff" stroke="#ffffff" />
        </svg>
      );
    case "scroll":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="18" height="18" rx="2" fill={color} stroke={color} />
          <path d="M8 11h12M8 14.5h12M8 18h8" stroke="#ffffff" strokeWidth="1.3" />
        </svg>
      );
    case "magnifier":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="6.5" fill={color} stroke={color} />
          <line x1="17" y1="17" x2="22" y2="22" />
          <circle cx="12" cy="12" r="3.2" fill="#ffffff" stroke="#ffffff" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M5 23 L10 18 L20 8 L23 11 L13 21 L8 23 Z" fill={color} stroke={color} />
          <line x1="10" y1="18" x2="13" y2="21" stroke="#ffffff" strokeWidth="1.3" />
        </svg>
      );
    case "lens":
      return (
        <svg {...common}>
          <rect x="5" y="9" width="18" height="13" rx="2" fill={color} stroke={color} />
          <rect x="11" y="6" width="6" height="4" rx="1" fill={color} stroke={color} />
          <circle cx="14" cy="15.5" r="3.5" fill="#ffffff" stroke="#ffffff" />
          <circle cx="20.5" cy="11.5" r="0.6" fill="#ffffff" stroke="#ffffff" />
        </svg>
      );
    case "plane":
      return (
        <svg {...common}>
          <path d="M3 14 L13 11 L22 4 L25 7 L18 16 L15 25 L12 22 L11 17 L4 17 Z" fill={color} stroke={color} />
        </svg>
      );
    case "tower":
      return (
        <svg {...common}>
          <path d="M6 22 H22 V19 H6 Z" fill={color} stroke={color} />
          <path d="M8 19 V14 H20 V19" fill={color} stroke={color} />
          <path d="M9 14 V10 H19 V14" fill={color} stroke={color} />
          <path d="M11 10 V7 L14 4 L17 7 V10" fill={color} stroke={color} />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18 Q4 18 4 15 Q4 12 7 12 Q8 9 12 9 Q16 9 17 12 Q21 12 21 15 Q21 18 18 18 Z" fill={color} stroke={color} />
          <circle cx="22" cy="9" r="2" fill="#fbbf24" stroke="#fbbf24" />
        </svg>
      );
    case "rail":
      return (
        <svg {...common}>
          <rect x="6" y="5" width="16" height="14" rx="3" fill={color} stroke={color} />
          <rect x="8" y="8" width="5" height="4" fill="#ffffff" stroke="#ffffff" />
          <rect x="15" y="8" width="5" height="4" fill="#ffffff" stroke="#ffffff" />
          <line x1="6" y1="20" x2="2" y2="24" />
          <line x1="22" y1="20" x2="26" y2="24" />
        </svg>
      );
    case "bowl":
      return (
        <svg {...common}>
          <path d="M4 13 H24 Q24 22 14 22 Q4 22 4 13 Z" fill={color} stroke={color} />
          <path d="M10 11 Q10 7 14 7 Q18 7 18 11" />
          <path d="M9 8 Q9 5 11 5" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 6 L14 7.5 L24 6 V22 L14 23.5 L4 22 Z" fill={color} stroke={color} />
          <line x1="14" y1="7.5" x2="14" y2="23.5" stroke="#ffffff" strokeWidth="1.3" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="9" fill={color} stroke={color} />
          <path d="M11 10 H17 M11 14 H17 M14 9 V19" stroke="#ffffff" strokeWidth="1.4" />
        </svg>
      );
    case "film":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="20" height="14" rx="1" fill={color} stroke={color} />
          <rect x="6" y="9" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
          <rect x="6" y="13" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
          <rect x="6" y="17" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
          <rect x="19" y="9" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
          <rect x="19" y="13" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
          <rect x="19" y="17" width="3" height="2" fill="#ffffff" stroke="#ffffff" />
        </svg>
      );
  }
}
