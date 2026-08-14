import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MapPin,
  Building2,
  Sparkles,
  ExternalLink,
  FileText,
  Download,
  Briefcase,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react'
import Avatar from './Avatar.jsx'
import { getCandidateDetail } from '../lib/data.js'
import { matchColor, stageMeta } from '../lib/format.js'

// A full-screen candidate profile with their uploaded résumé (from Manatal) and
// the job(s) they applied to. Opens when a candidate card is clicked.
export default function CandidateModal({ candidate, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) return
    setLoading(true)
    setError('')
    setDetail(null)
    getCandidateDetail(candidate.manatalId || candidate.id)
      .then((d) => setDetail(d))
      .catch((e) => setError(e.message || 'Could not load candidate'))
      .finally(() => setLoading(false))
  }, [candidate])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!candidate) return null

  // Prefer freshly-loaded detail, fall back to the card's known fields.
  const c = { ...candidate, ...(detail || {}) }
  const stage = stageMeta(c.stage)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="glass relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden"
        >
          {/* Cover + header */}
          <div
            className="h-16 w-full shrink-0"
            style={{
              background: `linear-gradient(120deg, ${matchColor(c.matchScore)}44, rgba(245,194,75,0.25) 60%, transparent)`,
            }}
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-slate-600 shadow-soft transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8 lg:flex-row">
            {/* LEFT: profile */}
            <div className="lg:w-2/5">
              <div className="-mt-6 flex items-end gap-4">
                <Avatar name={c.name} photoUrl={c.photoUrl} size={72} className="ring-4 ring-surface" />
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-ink">{c.name}</h2>
                  <p className="text-sm text-slate-500">{c.headline}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {c.company && <Meta icon={Building2} text={c.company} />}
                {c.location && <Meta icon={MapPin} text={c.location} />}
                <span
                  className="chip font-semibold"
                  style={{ background: `${stage.color}22`, color: stage.color }}
                >
                  {stage.label}
                </span>
              </div>

              {c.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.skills.map((s) => (
                    <span key={s} className="chip border border-accent/30 bg-accent/10 font-medium text-amber-700">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Applied for */}
              {c.appliedFor?.length > 0 && (
                <div className="mt-5">
                  <p className="label mb-2 flex items-center gap-1.5">
                    <Briefcase size={12} /> Applied for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.appliedFor.map((j, i) => (
                      <span key={i} className="chip bg-cream font-medium text-ink">
                        {j}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {c.enrichmentSummary && (
                <div className="mt-5">
                  <p className="label mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-600" /> Profile summary
                  </p>
                  <p className="text-[15px] leading-relaxed text-slate-700">{c.enrichmentSummary}</p>
                </div>
              )}

              {/* Full description, when Manatal has one distinct from the summary */}
              {c.description && c.description !== c.enrichmentSummary && (
                <div className="mt-5">
                  <p className="label mb-2">Description</p>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
                    {c.description}
                  </p>
                </div>
              )}

              {c.experience?.length > 0 && (
                <div className="mt-5">
                  <p className="label mb-2">Experience</p>
                  <History items={c.experience} />
                </div>
              )}

              {c.education?.length > 0 && (
                <div className="mt-5">
                  <p className="label mb-2">Education</p>
                  <History items={c.education} />
                </div>
              )}

              {(c.email || c.phone) && (
                <div className="mt-5">
                  <p className="label mb-2">Contact</p>
                  <div className="flex flex-col gap-1.5 text-sm text-slate-700">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 hover:text-amber-600">
                        <Mail size={14} className="text-slate-500" /> {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone size={14} className="text-slate-500" /> {c.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {c.profileUrl && (
                  <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <ExternalLink size={15} /> LinkedIn
                  </a>
                )}
                {c.resumeUrl && (
                  <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    <Download size={15} /> Download résumé
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT: résumé */}
            <div className="min-h-[24rem] flex-1 lg:w-3/5">
              <p className="label mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Résumé
              </p>
              <ResumeView loading={loading} error={error} detail={detail} candidate={candidate} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ResumeView({ loading, error, detail, candidate }) {
  const box =
    'flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-black/[0.06] bg-cream p-6 text-center'

  if (loading)
    return (
      <div className={box}>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading résumé from Manatal…
        </span>
      </div>
    )

  if (detail?.demo)
    return (
      <div className={box}>
        <p className="max-w-xs text-sm text-slate-500">
          Résumés load in your live app connected to Manatal. This shared preview has no Manatal
          access.
        </p>
      </div>
    )

  if (error)
    return (
      <div className={box}>
        <p className="max-w-xs text-sm text-bad">Couldn't load résumé: {error}</p>
      </div>
    )

  const url = detail?.resumeUrl
  const docs = detail?.documents || []

  if (!url && docs.length === 0)
    return (
      <div className={box}>
        <p className="max-w-xs text-sm text-slate-500">
          No résumé or documents are attached to this candidate in Manatal.
        </p>
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      {url && (
        <iframe
          title="Résumé"
          src={url}
          className="h-[26rem] w-full flex-1 rounded-2xl border border-black/[0.06] bg-white"
        />
      )}
      {docs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {docs.map((d, i) => (
            <a
              key={i}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="chip border border-black/[0.08] bg-white font-medium text-ink hover:bg-cream"
            >
              <FileText size={13} /> {d.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function Meta({ icon: Icon, text }) {
  return (
    <span className="chip bg-black/[0.04] text-slate-600">
      <Icon size={13} className="text-slate-500" /> {text}
    </span>
  )
}

function History({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-black/[0.06] bg-cream p-3">
          {it.title && <p className="text-sm font-semibold text-ink">{it.title}</p>}
          {it.org && <p className="text-xs text-slate-600">{it.org}</p>}
          {it.period && <p className="mt-0.5 text-[11px] text-slate-500">{it.period}</p>}
        </div>
      ))}
    </div>
  )
}
