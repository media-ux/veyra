import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, MapPin } from 'lucide-react'
import { getCandidates, updateCandidate } from '../lib/data.js'
import PageHeader from '../components/PageHeader.jsx'
import { Skeleton } from '../components/Skeleton.jsx'
import { useToast } from '../components/Toast.jsx'
import Avatar from '../components/Avatar.jsx'
import CandidateModal from '../components/CandidateModal.jsx'
import { STAGES, matchColor } from '../lib/format.js'

export default function Pipeline() {
  const toast = useToast()
  const [candidates, setCandidates] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const [selected, setSelected] = useState(null) // candidate whose detail modal is open
  const movedRef = useRef(false) // true if a drag happened, so we don't treat it as a click

  useEffect(() => {
    getCandidates().then(setCandidates)
  }, [])

  const moveTo = async (candidateId, stage) => {
    const cand = candidates.find((c) => c.id === candidateId)
    if (!cand || cand.stage === stage) return
    // Optimistic update — snap the card, then persist.
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage } : c)),
    )
    try {
      await updateCandidate(candidateId, { stage })
      toast.success(`${cand.name} → ${STAGES.find((s) => s.key === stage)?.label}`)
    } catch (err) {
      toast.error('Could not move card')
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: cand.stage } : c)),
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Drag candidates between stages. Moving a card updates their stage everywhere."
      />

      {!candidates ? (
        <div className="flex gap-4 overflow-x-auto">
          {STAGES.map((s) => (
            <Skeleton key={s.key} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const cards = candidates.filter((c) => c.stage === stage.key)
            const isOver = overStage === stage.key
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverStage(stage.key)
                }}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  moveTo(id, stage.key)
                  setOverStage(null)
                  setDraggingId(null)
                }}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                  isOver
                    ? 'border-accent/40 bg-accent/[0.06]'
                    : 'border-black/5 bg-black/[0.02]'
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                    <h3 className="text-sm font-semibold text-slate-700">{stage.label}</h3>
                  </div>
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {cards.length}
                  </span>
                </div>

                <div className="flex min-h-[6rem] flex-1 flex-col gap-2.5">
                  <AnimatePresence>
                    {cards.map((c) => (
                      <motion.div
                        layout
                        layoutId={c.id}
                        key={c.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: draggingId === c.id ? 0.4 : 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', c.id)
                          e.dataTransfer.effectAllowed = 'move'
                          movedRef.current = true
                          setDraggingId(c.id)
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onMouseDown={() => (movedRef.current = false)}
                        onClick={() => {
                          // Ignore the click that follows a drag; open detail on a real click.
                          if (!movedRef.current) setSelected(c)
                        }}
                        className="group cursor-pointer rounded-xl border border-black/5 bg-white p-3 shadow-soft transition-shadow hover:shadow-card active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar name={c.name} photoUrl={c.photoUrl} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                            <p className="truncate text-xs text-slate-500">{c.headline}</p>
                          </div>
                          <GripVertical
                            size={15}
                            className="mt-0.5 shrink-0 cursor-grab text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin size={11} /> {c.company}
                          </span>
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: matchColor(c.matchScore) }}
                          >
                            {c.matchScore}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
