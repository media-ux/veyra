import { motion } from 'framer-motion'

// Soft, slow-moving warm blobs behind the whole app. Light-theme friendly:
// gentle yellow/cream tints on the paper background, plus a faint grid.
export default function AuroraBackground() {
  const blobs = [
    { color: 'rgba(245, 194, 75, 0.22)', size: 620, top: '-10%', left: '68%', dur: 20 },
    { color: 'rgba(245, 194, 75, 0.14)', size: 520, top: '35%', left: '-8%', dur: 24 },
    { color: 'rgba(250, 231, 168, 0.30)', size: 460, top: '75%', left: '55%', dur: 28 },
  ]
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ width: b.size, height: b.size, top: b.top, left: b.left, background: b.color }}
          animate={{ x: [0, 36, -28, 0], y: [0, -26, 18, 0], scale: [1, 1.1, 0.96, 1] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* faint dark grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(28,28,30,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,30,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
