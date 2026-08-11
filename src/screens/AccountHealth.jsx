import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, ShieldX, ExternalLink } from 'lucide-react'
import { getAccounts } from '../lib/data.js'
import PageHeader from '../components/PageHeader.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import { usageState } from '../lib/format.js'

// Hard safety limits per account (enforced by the backend too).
const LIMITS = { dailyMax: 20, weeklyMax: 90 }

const STATE_STYLES = {
  green: { color: '#34d399', ring: 'ring-good/30', bg: 'bg-good/10', Icon: ShieldCheck, label: 'Healthy' },
  amber: { color: '#fbbf24', ring: 'ring-warn/30', bg: 'bg-warn/10', Icon: ShieldAlert, label: 'Approaching limit' },
  red: { color: '#f87171', ring: 'ring-bad/30', bg: 'bg-bad/10', Icon: ShieldX, label: 'Blocked' },
}

export default function AccountHealth() {
  const [accounts, setAccounts] = useState(null)

  useEffect(() => {
    getAccounts().then(setAccounts)
  }, [])

  return (
    <div>
      <PageHeader
        title="Account Health"
        subtitle="Each LinkedIn account has hard limits of 20 sends/day and 90/week. The queue blocks automatically when a limit is hit."
      />

      {!accounts ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a, i) => (
            <AccountCard key={a.id} account={a} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountCard({ account, index }) {
  const dailyPct = (account.dailyQuotaUsed / LIMITS.dailyMax) * 100
  const weeklyPct = (account.weeklyQuotaUsed / LIMITS.weeklyMax) * 100
  const worst = Math.max(dailyPct, weeklyPct)

  // A blocked state is reached at 100% of either limit.
  const isBlocked =
    account.dailyQuotaUsed >= LIMITS.dailyMax || account.weeklyQuotaUsed >= LIMITS.weeklyMax
  const state = isBlocked ? 'red' : usageState(worst)
  const s = STATE_STYLES[state]
  const { Icon } = s

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
      className={`glass relative overflow-hidden p-6 ring-1 ${s.ring}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
        style={{ background: `${s.color}22` }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{account.name}</h2>
          <a
            href={account.linkedinProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-accent"
          >
            LinkedIn profile <ExternalLink size={11} />
          </a>
        </div>
        <span
          className={`chip ${s.bg} font-semibold`}
          style={{ color: s.color }}
        >
          <Icon size={13} /> {s.label}
        </span>
      </div>

      <div className="relative mt-6 space-y-5">
        <UsageBar
          label="Today"
          used={account.dailyQuotaUsed}
          max={LIMITS.dailyMax}
          pct={dailyPct}
        />
        <UsageBar
          label="This week"
          used={account.weeklyQuotaUsed}
          max={LIMITS.weeklyMax}
          pct={weeklyPct}
        />
      </div>

      {isBlocked && (
        <div className="relative mt-5 flex items-start gap-2 rounded-xl border border-bad/20 bg-bad/10 p-3 text-xs text-bad">
          <ShieldX size={15} className="mt-0.5 shrink-0" />
          <span>
            Safety limit reached. The send queue is blocked for this account until usage resets.
          </span>
        </div>
      )}
    </motion.div>
  )
}

function UsageBar({ label, used, max, pct }) {
  const state = usageState(pct)
  const color = STATE_STYLES[state].color
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {used}
          <span className="text-slate-600"> / {max}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}
