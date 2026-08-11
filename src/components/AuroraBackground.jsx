import { motion } from 'framer-motion'

// Slow-moving gradient "aurora" blobs behind the whole app. Purely decorative,
// fixed and non-interactive, giving the dark theme depth and gentle motion.
export default function AuroraBackground() {
  const blobs = [
    { color: 'rgba(91,140,255,0.22)', size: 620, top: '-8%', left: '-6%', dur: 18 },
    { color: 'rgba(124,88,255,0.18)', size: 520, top: '30%', left: '70%', dur: 22 },
    { color: 'rgba(52,211,153,0.10)', size: 460, top: '72%', left: '10%', dur: 26 },
  ]
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ width: b.size, height: b.size, top: b.top, left: b.left, background: b.color }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* faint grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
    </div>
  )
}
