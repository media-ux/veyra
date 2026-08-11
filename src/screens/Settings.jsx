import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Plug,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquareText,
  Target,
  Palette,
} from 'lucide-react'
import {
  getSettings,
  updateSettings,
  getConnections,
  classifyReply,
  resetDemoData,
  syncFromManatal,
} from '../lib/data.js'
import PageHeader from '../components/PageHeader.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import { useToast } from '../components/Toast.jsx'
import { classificationMeta } from '../lib/format.js'

export default function Settings() {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [connections, setConnections] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
    getConnections().then(setConnections)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updateSettings({
        tone: settings.tone,
        dailyTargetPerAccount: settings.dailyTargetPerAccount,
        templates: settings.templates,
      })
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    await resetDemoData()
    toast.info('Demo data reset. Refresh other screens to see it.')
    getSettings().then(setSettings)
  }

  if (!settings) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton className="h-72" />
          <CardSkeleton className="h-72" />
        </div>
      </div>
    )
  }

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))
  const updateTemplate = (id, body) =>
    setSettings((s) => ({
      ...s,
      templates: s.templates.map((t) => (t.id === id ? { ...t, body } : t)),
    }))

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Message templates, tone, daily targets and integrations."
        actions={
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Connections */}
        <Section icon={Plug} title="Connections" delay={0}>
          <p className="mb-4 text-xs text-slate-500">
            Keys live only in the server's <code className="text-slate-400">.env</code> file. This
            just reflects whether they are set.
          </p>
          <div className="space-y-3">
            <ConnectionRow name="Manatal" status={connections?.manatal} />
            <ConnectionRow name="DeepSeek" status={connections?.deepseek} />
          </div>
          <ManatalSync connected={connections?.manatal === 'connected'} />
        </Section>

        {/* Tone + daily target */}
        <Section icon={Palette} title="Tone & targets" delay={0.05}>
          <label className="label">Default message tone</label>
          <div className="mt-2 flex gap-2">
            {['direct', 'warm', 'technical'].map((t) => (
              <button
                key={t}
                onClick={() => update({ tone: t })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                  settings.tone === t
                    ? 'border-accent/40 bg-accent/15 text-white'
                    : 'border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="label mt-6 flex items-center gap-1.5">
            <Target size={12} /> Daily target per account
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={settings.dailyTargetPerAccount}
              onChange={(e) => update({ dailyTargetPerAccount: Number(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="w-10 text-center text-lg font-bold text-white">
              {settings.dailyTargetPerAccount}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            The queue's daily progress bar fills toward this number. Hard safety cap stays at 20/day.
          </p>
        </Section>

        {/* Templates */}
        <Section icon={MessageSquareText} title="Message templates" delay={0.1} className="lg:col-span-2">
          <p className="mb-4 text-xs text-slate-500">
            Starting points for the AI. Use <code className="text-slate-400">{'{{firstName}}'}</code>,{' '}
            <code className="text-slate-400">{'{{company}}'}</code> and{' '}
            <code className="text-slate-400">{'{{hook}}'}</code> as placeholders.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {settings.templates.map((t) => (
              <div key={t.id}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-300">{t.name}</label>
                <textarea
                  value={t.body}
                  onChange={(e) => updateTemplate(t.id, e.target.value)}
                  className="h-28 w-full resize-none rounded-xl border border-white/5 bg-base-900/50 p-3 text-sm text-slate-100 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Reply classifier tool */}
        <ReplyClassifier />

        {/* Danger / dev zone */}
        <Section icon={RotateCcw} title="Demo data" delay={0.2}>
          <p className="mb-4 text-xs text-slate-500">
            Restore the 20 seed candidates and reset all usage counters back to their starting
            values. Handy while exploring before you connect real data.
          </p>
          <button onClick={reset} className="btn-ghost">
            <RotateCcw size={15} /> Reset demo data
          </button>
        </Section>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children, delay = 0, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120, damping: 18 }}
      className={`glass p-6 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/25">
          <Icon size={15} />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.section>
  )
}

function ManatalSync({ connected }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const r = await syncFromManatal()
      if (r.count === 0) toast.info('Connected, but Manatal returned no candidates.')
      else toast.success(`Synced ${r.count} candidates from Manatal. Refresh the other screens.`)
    } catch (err) {
      toast.error(err.message || 'Manatal sync failed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mt-4">
      <button onClick={run} disabled={busy} className="btn-ghost w-full">
        {busy ? 'Syncing…' : 'Sync candidates from Manatal'}
      </button>
      {!connected && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Add <code className="text-slate-400">MANATAL_API_KEY</code> to <code className="text-slate-400">.env</code> and
          restart to enable this. In the shared preview it stays disabled (no server).
        </p>
      )}
    </div>
  )
}

function ConnectionRow({ name, status }) {
  const connected = status === 'connected'
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-sm font-medium text-slate-200">{name}</span>
      {status == null ? (
        <span className="text-xs text-slate-500">checking…</span>
      ) : connected ? (
        <span className="chip bg-good/10 font-semibold text-good">
          <CheckCircle2 size={13} /> Connected
        </span>
      ) : (
        <span className="chip bg-white/[0.05] font-semibold text-slate-400">
          <XCircle size={13} /> Not connected
        </span>
      )}
    </div>
  )
}

function ReplyClassifier() {
  const toast = useToast()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const r = await classifyReply(text)
      setResult(r)
    } catch {
      toast.error('Could not classify')
    } finally {
      setLoading(false)
    }
  }

  const meta = result ? classificationMeta(result.classification) : null

  return (
    <Section icon={MessageSquareText} title="Reply classifier">
      <p className="mb-3 text-xs text-slate-500">
        Paste a candidate's reply. DeepSeek labels it interested / not interested / needs follow up.
        (Uses a local sample until a key is added.)
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an incoming reply here…"
        className="h-24 w-full resize-none rounded-xl border border-white/5 bg-base-900/50 p-3 text-sm text-slate-100 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={loading || !text.trim()} className="btn-primary">
          {loading ? 'Classifying…' : 'Classify reply'}
        </button>
        {meta && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="chip font-semibold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </motion.span>
        )}
      </div>
    </Section>
  )
}
