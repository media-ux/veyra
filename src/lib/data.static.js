// ===========================================================================
//  data.static.js — BROWSER-ONLY version of the data layer, used ONLY to build
//  the zero-install preview (no backend, no API keys). It keeps the exact same
//  function names as src/lib/data.js so the screens work unchanged, but the
//  data lives in memory and resets on refresh.
//
//  This file is NOT used by the real app (npm run dev). It exists purely so the
//  whole UI can be shown as a single self-contained page.
// ===========================================================================
import { buildSeed } from '../../server/seed.js'

const LIMITS = { dailyMax: 20, weeklyMax: 90 }
let db = buildSeed()

const delay = (v, ms = 220) => new Promise((r) => setTimeout(() => r(v), ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

export function getAccounts() {
  return delay(clone(db.accounts))
}

export function getCandidates() {
  return delay(clone(db.candidates))
}

export function updateCandidate(id, patch) {
  const c = db.candidates.find((x) => x.id === id)
  if (c) Object.assign(c, patch)
  return delay(clone(c))
}

export function getQueue() {
  return delay(clone(db.queue))
}

export function updateQueueItem(id, patch) {
  const item = db.queue.find((q) => q.id === id)
  if (!item) return Promise.reject(new Error('Queue item not found'))
  if (typeof patch.draftMessage === 'string') item.draftMessage = patch.draftMessage

  if (patch.status === 'sent') {
    const account = db.accounts.find((a) => a.id === item.accountId)
    if (account.dailyQuotaUsed >= LIMITS.dailyMax)
      return Promise.reject(new Error(`${account.name} has hit the daily limit of ${LIMITS.dailyMax} sends.`))
    if (account.weeklyQuotaUsed >= LIMITS.weeklyMax)
      return Promise.reject(new Error(`${account.name} has hit the weekly limit of ${LIMITS.weeklyMax} sends.`))
    item.status = 'sent'
    item.sentAt = new Date().toISOString()
    account.dailyQuotaUsed += 1
    account.weeklyQuotaUsed += 1
    const cand = db.candidates.find((c) => c.id === item.candidateId)
    if (cand && cand.stage !== 'invited') cand.stage = 'invited'
  } else if (patch.status) {
    item.status = patch.status
    if (patch.status === 'pending') item.sentAt = null
  }
  return delay(clone(item))
}

export function getReplies() {
  return delay(clone(db.replies))
}

export function saveReply(reply) {
  const r = { id: `reply_${Math.random().toString(36).slice(2, 8)}`, receivedAt: new Date().toISOString(), ...reply }
  db.replies.push(r)
  return delay(clone(r))
}

export function getSettings() {
  return delay(clone(db.settings))
}

export function updateSettings(patch) {
  db.settings = { ...db.settings, ...patch }
  return delay(clone(db.settings))
}

export function getStats() {
  const invitesThisWeek = db.accounts.reduce((s, a) => s + a.weeklyQuotaUsed, 0)
  const weeklyCapacity = db.accounts.length * LIMITS.weeklyMax
  const accepted = db.candidates.filter((c) => ['accepted', 'replied', 'interview'].includes(c.stage)).length
  const invited = db.candidates.filter((c) => ['invited', 'accepted', 'replied', 'interview'].includes(c.stage)).length
  const byStage = db.candidates.reduce((acc, c) => ((acc[c.stage] = (acc[c.stage] || 0) + 1), acc), {})
  return delay({
    invitesThisWeek,
    remainingWeeklyQuota: Math.max(weeklyCapacity - invitesThisWeek, 0),
    weeklyCapacity,
    acceptanceRate: invited ? Math.round((accepted / invited) * 100) : 0,
    repliesReceived: db.replies.length,
    byStage,
    activity: db.activity,
  })
}

// No keys in a static preview — show "not connected".
export function getConnections() {
  return delay({ manatal: 'not connected', deepseek: 'not connected' })
}

// Local mock draft/classify (mirrors server/ai.js fallbacks).
export function generateMessage(candidateId, tone = 'warm') {
  const c = db.candidates.find((x) => x.id === candidateId)
  const firstName = c.name.split(' ')[0]
  const hook = c.enrichmentSummary.split('.')[0]
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)
  const openers = {
    direct: `Hi ${firstName}, ${lower(hook)} caught my eye.`,
    warm: `Hi ${firstName} — I came across your work and ${lower(hook)} genuinely stood out.`,
    technical: `Hi ${firstName}, ${lower(hook)} — that's exactly the kind of engineering we care about.`,
  }
  const msg = `${openers[tone] || openers.warm} I'm helping EX Venture grow its engineering team and would love to connect.`
  return delay({ message: msg.slice(0, 300), source: 'mock' }, 500)
}

export function classifyReply(text) {
  const t = text.toLowerCase()
  let classification = 'needs follow up'
  if (/\b(not open|no thanks|not interested|just started|not looking)\b/.test(t)) classification = 'not interested'
  else if (/\b(love to|interested|tell me more|keen|sounds great|share details)\b/.test(t)) classification = 'interested'
  return delay({ classification, source: 'mock' }, 500)
}

// Manatal sync needs the backend + your key, which the static preview doesn't
// have. Explain that clearly instead of failing silently.
export function syncFromManatal() {
  return Promise.reject(
    new Error('Manatal sync runs in the full app (npm run dev) with your key in .env — not in this preview.'),
  )
}

export function resetDemoData() {
  db = buildSeed()
  return delay({ ok: true })
}
