import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  SkipForward,
  MapPin,
  Building2,
  Sparkles,
  Keyboard,
  PartyPopper,
  ShieldAlert,
} from 'lucide-react'
import {
  getQueue,
  getCandidates,
  getAccounts,
  getSettings,
  updateQueueItem,
  generateMessage,
} from '../lib/data.js'
import PageHeader from '../components/PageHeader.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import { useToast } from '../components/Toast.jsx'
import { initials } from '../lib/format.js'

const MAX_CHARS = 300
const LIMITS = { dailyMax: 20, weeklyMax: 90 }

export default function SendQueue() {
  const toast = useToast()
  const [items, setItems] = useState(null) // enriched pending queue items
  const [accounts, setAccounts] = useState([])
  const [tone, setTone] = useState('warm')
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [exitDir, setExitDir] = useState(1)
  const [regenerating, setRegenerating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dailyTarget, setDailyTarget] = useState(15)
  const draftRef = useRef('')

  // Load everything and stitch the queue together with candidate + account data.
  useEffect(() => {
    Promise.all([getQueue(), getCandidates(), getAccounts(), getSettings()]).then(
      ([queue, candidates, accts, settings]) => {
        setAccounts(accts)
        setTone(settings.tone)
        setDailyTarget(settings.dailyTargetPerAccount || 15)
        const pending = queue
          .filter((q) => q.status === 'pending')
          .map((q) => ({
            ...q,
            candidate: candidates.find((c) => c.id === q.candidateId),
            account: accts.find((a) => a.id === q.accountId),
          }))
          .filter((q) => q.candidate && q.account)
        setItems(pending)
      },
    )
  }, [])

  const current = items?.[index]

  // Keep the editable draft in sync with the current card.
  useEffect(() => {
    if (current) {
      setDraft(current.draftMessage)
      draftRef.current = current.draftMessage
    }
  }, [current])

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const advance = useCallback((dir) => {
    setExitDir(dir)
    setIndex((i) => i + 1)
  }, [])

  const liveAccount = current ? accounts.find((a) => a.id === current.account.id) : null
  const blocked =
    liveAccount &&
    (liveAccount.dailyQuotaUsed >= LIMITS.dailyMax ||
      liveAccount.weeklyQuotaUsed >= LIMITS.weeklyMax)

  const handleSend = useCallback(async () => {
    if (!current || busy) return
    if (blocked) {
      toast.error(`${liveAccount.name} has hit a safety limit — cannot send.`)
      return
    }
    setBusy(true)
    try {
      await updateQueueItem(current.id, { status: 'sent', draftMessage: draftRef.current })
      // Bump the account usage locally so the progress bar + block state update.
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === current.account.id
            ? { ...a, dailyQuotaUsed: a.dailyQuotaUsed + 1, weeklyQuotaUsed: a.weeklyQuotaUsed + 1 }
            : a,
        ),
      )
      toast.success(`Marked as sent for ${current.candidate.name}`)
      advance(1)
    } catch (err) {
      toast.error(err.message || 'Could not mark as sent')
    } finally {
      setBusy(false)
    }
  }, [current, busy, blocked, liveAccount, toast, advance])

  const handleSkip = useCallback(async () => {
    if (!current || busy) return
    setBusy(true)
    try {
      await updateQueueItem(current.id, { status: 'skipped' })
      toast.info(`Skipped ${current.candidate.name}`)
      advance(-1)
    } catch (err) {
      toast.error(err.message || 'Could not skip')
    } finally {
      setBusy(false)
    }
  }, [current, busy, toast, advance])

  const handleRegenerate = useCallback(async () => {
    if (!current || regenerating) return
    setRegenerating(true)
    try {
      const { message, source } = await generateMessage(current.candidate.id, tone)
      setDraft(message.slice(0, MAX_CHARS))
      toast.success(source === 'deepseek' ? 'New message drafted' : 'New draft (local sample)')
    } catch (err) {
      toast.error(err.message || 'Could not regenerate')
    } finally {
      setRegenerating(false)
    }
  }, [current, regenerating, tone, toast])

  const handleCopyOpen = useCallback(() => {
    if (!current) return
    navigator.clipboard?.writeText(draftRef.current).catch(() => {})
    window.open(current.candidate.profileUrl, '_blank', 'noopener')
    toast.info('Copied — paste it into LinkedIn and click send yourself')
  }, [current, toast])

  // Keyboard shortcuts: S = send, K = skip, R = regenerate.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSend() }
      else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); handleSkip() }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); handleRegenerate() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSend, handleSkip, handleRegenerate])

  if (!items) {
    return (
      <div>
        <PageHeader title="Daily Send Queue" subtitle="One candidate at a time." />
        <CardSkeleton className="h-96" />
      </div>
    )
  }

  const done = index >= items.length
  const sentSoFar = liveAccount ? liveAccount.dailyQuotaUsed : 0

  return (
    <div>
      <PageHeader
        title="Daily Send Queue"
        subtitle="Review, personalise, then send from your own LinkedIn — nothing is sent automatically."
        actions={<ToneSelector tone={tone} onChange={setTone} />}
      />

      {/* Daily target progress for the current account */}
      {current && (
        <DailyProgress
          account={liveAccount}
          target={dailyTarget}
          sent={sentSoFar}
          remaining={items.length - index}
        />
      )}

      <div className="relative mt-6 min-h-[30rem]">
        <AnimatePresence mode="wait" custom={exitDir}>
          {done ? (
            <EmptyState key="done" total={items.length} />
          ) : (
            <motion.div
              key={current.id}
              custom={exitDir}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={(dir) => ({
                opacity: 0,
                x: dir * 420,
                rotate: dir * 6,
                scale: 0.9,
                transition: { type: 'spring', stiffness: 220, damping: 26 },
              })}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {/* LEFT: enriched profile + match score */}
              <ProfilePanel candidate={current.candidate} account={current.account} />

              {/* RIGHT: editable AI message */}
              <MessagePanel
                draft={draft}
                setDraft={setDraft}
                regenerating={regenerating}
                busy={busy}
                blocked={blocked}
                blockReason={
                  blocked
                    ? `${liveAccount.name} has reached a safety limit. Sending is disabled for this account.`
                    : null
                }
                onRegenerate={handleRegenerate}
                onCopyOpen={handleCopyOpen}
                onSend={handleSend}
                onSkip={handleSkip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!done && <ShortcutHint />}
    </div>
  )
}

function DailyProgress({ account, target, sent, remaining }) {
  const pct = Math.min((sent / target) * 100, 100)
  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">
          {account?.name} · {sent}/{target} sent today
        </span>
        <span className="text-slate-500">{remaining} left in queue</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-glow to-accent-soft"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

function ProfilePanel({ candidate, account }) {
  return (
    <div className="glass relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/15 text-lg font-bold text-accent ring-1 ring-accent/30">
            {initials(candidate.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
            <p className="text-sm text-slate-400">{candidate.headline}</p>
          </div>
        </div>
        <MatchScore score={candidate.matchScore} />
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2">
        <Meta icon={Building2} text={candidate.company} />
        <Meta icon={MapPin} text={candidate.location} />
      </div>

      <div className="relative mt-6">
        <p className="label mb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-accent" /> Enriched profile summary
        </p>
        <p className="text-[15px] leading-relaxed text-slate-200">
          {candidate.enrichmentSummary}
        </p>
      </div>

      <div className="relative mt-6 flex items-center gap-2 border-t border-white/5 pt-4 text-xs text-slate-500">
        <span className="chip bg-white/[0.05] text-slate-300">Manatal · {candidate.manatalId}</span>
        <span className="chip bg-white/[0.05] text-slate-300">Account · {account.name}</span>
      </div>
    </div>
  )
}

function MatchScore({ score }) {
  const color = score >= 90 ? '#34d399' : score >= 80 ? '#5b8cff' : '#fbbf24'
  return (
    <div className="text-right">
      <div className="text-3xl font-extrabold" style={{ color }}>
        {score}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Match</p>
    </div>
  )
}

function Meta({ icon: Icon, text }) {
  return (
    <span className="chip bg-white/[0.04] text-slate-300">
      <Icon size={13} className="text-slate-500" /> {text}
    </span>
  )
}

function MessagePanel({
  draft,
  setDraft,
  regenerating,
  busy,
  blocked,
  blockReason,
  onRegenerate,
  onCopyOpen,
  onSend,
  onSkip,
}) {
  const count = draft.length
  const near = count > MAX_CHARS - 40
  const over = count >= MAX_CHARS

  return (
    <div className="glass flex flex-col p-6 sm:p-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="label flex items-center gap-1.5">
          <Sparkles size={12} className="text-accent" /> AI-drafted connection note
        </p>
        <span
          className={`text-xs font-semibold ${
            over ? 'text-bad' : near ? 'text-warn' : 'text-slate-500'
          }`}
        >
          {count}/{MAX_CHARS}
        </span>
      </div>

      <div className="relative flex-1">
        <textarea
          value={draft}
          maxLength={MAX_CHARS}
          onChange={(e) => setDraft(e.target.value)}
          className="h-48 w-full resize-none rounded-xl border border-white/5 bg-base-900/50 p-4 text-[15px] leading-relaxed text-slate-100 outline-none transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
          placeholder="Your personalised message…"
        />
        {regenerating && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-base-900/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-accent">
              <RefreshCw size={16} className="animate-spin" /> Drafting…
            </div>
          </div>
        )}
      </div>

      {blocked && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-bad/20 bg-bad/10 p-3 text-xs text-bad">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
          <span>{blockReason}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onRegenerate} disabled={regenerating} className="btn-ghost">
          <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} /> Regenerate
          <Kbd>R</Kbd>
        </button>
        <button onClick={onCopyOpen} className="btn-ghost">
          <Copy size={16} /> Copy & Open
          <ExternalLink size={13} className="opacity-60" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button onClick={onSkip} disabled={busy} className="btn-ghost text-slate-400">
          <SkipForward size={16} /> Skip <Kbd>K</Kbd>
        </button>
        <button onClick={onSend} disabled={busy || blocked} className="btn-primary">
          <Check size={16} /> Mark Sent <Kbd light>S</Kbd>
        </button>
      </div>
    </div>
  )
}

function ToneSelector({ tone, onChange }) {
  const tones = ['direct', 'warm', 'technical']
  return (
    <div className="flex rounded-xl border border-white/5 bg-white/[0.03] p-1">
      {tones.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
            tone === t ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tone === t && (
            <motion.span
              layoutId="tone-active"
              className="absolute inset-0 rounded-lg bg-accent/20 ring-1 ring-accent/30"
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          )}
          <span className="relative">{t}</span>
        </button>
      ))}
    </div>
  )
}

function Kbd({ children, light }) {
  return (
    <kbd
      className={`ml-1 hidden rounded border px-1.5 py-0.5 text-[10px] font-bold sm:inline ${
        light ? 'border-white/30 text-white/80' : 'border-white/10 text-slate-500'
      }`}
    >
      {children}
    </kbd>
  )
}

function ShortcutHint() {
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
      <Keyboard size={14} />
      <span>
        <b className="text-slate-400">S</b> send · <b className="text-slate-400">K</b> skip ·{' '}
        <b className="text-slate-400">R</b> regenerate
      </span>
    </div>
  )
}

function EmptyState({ total }) {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      className="glass grid place-items-center px-6 py-24 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-good/15 text-good ring-1 ring-good/30">
        <PartyPopper size={28} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-white">Queue cleared</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        You worked through {total} candidate{total === 1 ? '' : 's'}. New candidates will appear
        here as they are sourced from Manatal.
      </p>
    </motion.div>
  )
}
