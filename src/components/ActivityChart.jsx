import { motion } from 'framer-motion'

// 7-day activity chart. Grouped bars (invites / accepted / replies) that grow
// up from the baseline with a staggered spring on load.
export default function ActivityChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.invitesSent))
  const series = [
    { key: 'invitesSent', label: 'Invites', color: '#5b8cff' },
    { key: 'accepted', label: 'Accepted', color: '#34d399' },
    { key: 'replies', label: 'Replies', color: '#fbbf24' },
  ]

  return (
    <div>
      <div className="flex items-end justify-between gap-3 sm:gap-5" style={{ height: 180 }}>
        {data.map((d, i) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-[150px] w-full items-end justify-center gap-1">
              {series.map((s) => (
                <motion.div
                  key={s.key}
                  className="w-full max-w-[10px] rounded-t-md"
                  style={{ background: s.color }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d[s.key] / max) * 100}%` }}
                  transition={{
                    delay: 0.15 + i * 0.06,
                    type: 'spring',
                    stiffness: 120,
                    damping: 18,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">{d.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
