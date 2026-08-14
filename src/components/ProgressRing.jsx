import { motion } from 'framer-motion'
import { usageColor } from '../lib/format.js'

// Circular progress ring that animates its arc on mount. Colour is derived
// from the percentage: green < 60%, amber 60–85%, red > 85%.
export default function ProgressRing({
  value = 0,
  max = 100,
  size = 96,
  stroke = 8,
  label,
  sublabel,
}) {
  const pct = Math.min((value / max) * 100, 100)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const color = usageColor(pct)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-ink/[0.06]"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ink">{Math.round(pct)}%</span>
          {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
        </div>
      </div>
      {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
    </div>
  )
}
