import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Gauge, TrendingUp, MessageSquare, ArrowRight } from 'lucide-react'
import { getStats, getAccounts, getReplies, getCandidates } from '../lib/data.js'
import PageHeader from '../components/PageHeader.jsx'
import CountUp from '../components/CountUp.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import ActivityChart from '../components/ActivityChart.jsx'
import Avatar from '../components/Avatar.jsx'
import { KpiSkeleton, Skeleton } from '../components/Skeleton.jsx'
import { STAGES, classificationMeta, relativeTime } from '../lib/format.js'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [replies, setReplies] = useState([])
  const [candidates, setCandidates] = useState([])

  useEffect(() => {
    getStats().then(setStats)
    getAccounts().then(setAccounts)
    getReplies().then(setReplies)
    getCandidates().then(setCandidates)
  }, [])

  const loading = !stats || !accounts

  const kpis = stats
    ? [
        { label: 'Invites sent this week', value: stats.invitesThisWeek, icon: Send, suffix: '' },
        { label: 'Remaining weekly quota', value: stats.remainingWeeklyQuota, icon: Gauge, suffix: '' },
        { label: 'Acceptance rate', value: stats.acceptanceRate, icon: TrendingUp, suffix: '%' },
        { label: 'Replies received', value: stats.repliesReceived, icon: MessageSquare, suffix: '' },
      ]
    : []

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your outreach at a glance, across every LinkedIn account."
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <motion.div
                key={k.label}
                variants={rise}
                className="glass glass-hover group relative overflow-hidden p-5"
              >
                {/* soft gradient glow behind the number */}
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl transition-opacity group-hover:opacity-80" />
                <div className="relative flex items-center justify-between">
                  <p className="label">{k.label}</p>
                  <Icon size={18} className="text-accent/80" />
                </div>
                <CountUp
                  value={k.value}
                  suffix={k.suffix}
                  className="glow-text relative mt-3 block text-4xl font-extrabold tracking-tight text-white"
                />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Middle row: activity chart + candidates by stage */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 18 }}
          className="glass p-6 xl:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">7-day activity</h2>
              <p className="text-xs text-slate-500">Invites, acceptances and replies</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-44 w-full" /> : <ActivityChart data={stats.activity} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 120, damping: 18 }}
          className="glass p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Candidates by stage</h2>
            <button
              onClick={() => onNavigate('pipeline')}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-soft"
            >
              Pipeline <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <StageBars byStage={stats.byStage} />
          )}
        </motion.div>
      </div>

      {/* Account quota rings */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, type: 'spring', stiffness: 120, damping: 18 }}
        className="glass mt-6 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Weekly quota per account</h2>
            <p className="text-xs text-slate-500">Invites used out of 100 this week</p>
          </div>
          <button
            onClick={() => onNavigate('health')}
            className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-soft"
          >
            Account health <ArrowRight size={13} />
          </button>
        </div>
        {loading ? (
          <div className="flex flex-wrap gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-around gap-8">
            {accounts.map((a) => (
              <ProgressRing
                key={a.id}
                value={a.weeklyQuotaUsed}
                max={100}
                label={a.name}
                sublabel={`${a.weeklyQuotaUsed}/100`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent replies */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, type: 'spring', stiffness: 120, damping: 18 }}
        className="glass mt-6 p-6"
      >
        <h2 className="mb-4 text-base font-semibold text-white">Recent replies</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : replies.length === 0 ? (
          <p className="text-sm text-slate-500">No replies yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {replies.slice(0, 3).map((r, i) => {
              const c = candidates.find((x) => x.id === r.candidateId)
              const meta = classificationMeta(r.classification)
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={c?.name || 'Unknown'} photoUrl={c?.photoUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {c?.name || 'Unknown'}
                      </p>
                      <p className="text-[11px] text-slate-500">{relativeTime(r.receivedAt)}</p>
                    </div>
                    <span
                      className="chip shrink-0 font-semibold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                    "{r.text}"
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StageBars({ byStage }) {
  const total = Math.max(1, ...STAGES.map((s) => byStage[s.key] || 0))
  return (
    <div className="space-y-3">
      {STAGES.map((s, i) => {
        const count = byStage[s.key] || 0
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-20 text-xs text-slate-400">{s.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(count / total) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="w-6 text-right text-xs font-semibold text-slate-200">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
