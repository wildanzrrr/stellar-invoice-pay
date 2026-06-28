"use client"

// One-shot confetti burst. Spawns N absolutely-positioned colored squares,
// each animated to fall + rotate via inline styles. Auto-cleans after
// ~2.4s. Pure CSS — no canvas / no deps.

import * as React from "react"

const COLORS = [
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#facc15", // yellow-400
  "#22d3ee", // cyan-400
]

const PIECES = 80

type Piece = {
  i: number
  left: number
  delay: number
  duration: number
  rotate: number
  drift: number
  size: number
  color: string
}

function rollPieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.6 + Math.random() * 1.0,
    rotate: Math.random() * 720 - 360,
    drift: Math.random() * 200 - 100,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
  }))
}

export function Confetti({ onDone }: { onDone?: () => void }) {
  // Lazy state initializer — runs once on first mount. Each new <Confetti>
  // instance the parent mounts will get its own fresh roll.
  const [pieces] = React.useState<Piece[]>(rollPieces)

  React.useEffect(() => {
    const max = 2400
    const t = setTimeout(() => onDone?.(), max)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.4}px`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              // CSS vars consumed by the keyframe
              ["--drift" as never]: `${p.drift}px`,
              ["--rotate" as never]: `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
