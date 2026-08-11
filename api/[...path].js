// ---------------------------------------------------------------------------
// Vercel serverless backend (one function handles every /api/* route).
//
// This is the hosted equivalent of server/index.js. The big difference: a
// hosting service has no writable database file, so data lives in memory for
// the life of the running instance, and candidates are pulled LIVE from your
// Manatal account on first load (using the MANATAL_API_KEY you set in the
// Vercel project's Environment Variables — it never reaches the browser).
//
// Local dev still uses server/index.js; this file is only used when deployed.
// ---------------------------------------------------------------------------
import express from 'express'
import { buildSeed } from '../server/seed.js'
import { fetchManatalCandidates, hasManatalKey, starterDraft } from '../server/manatal.js'
import { draftMessage, classifyReply, hasDeepSeekKey } from '../server/ai.js'

const LIMITS = { dailyMax: 20, weeklyMax: 90 }

// In-memory store (resets when the serverless instance goes cold — fine for a
// live viewer; add a database here later if you need durable edits).
let db = null
let manatalState = { attempted: false, ok: false, count: 0, error: null }

function getDb() {
  if (!db) db = buildSeed()
  return db
}

// Pull real candidates from Manatal once per warm instance.
async function ensureManatal() {
  if (manatalState.attempted || !hasManatalKey()) return
  manatalState.attempted = true
  try {
    const pulled = await fetchManatalCandidates({ limit: 40 })
    if (pulled.length) {
      const d = getDb()
      const accounts = d.accounts
      d.candidates = pulled.map((c, i) => ({
        id: `cand_m${i + 1}`,
        assignedAccount: accounts[i % accounts.length].id,
        ...c,
      }))
      d.queue = d.candidates.map((c, i) => ({
        id: `q_m${i + 1}`,
        candidateId: c.id,
        accountId: c.assignedAccount,
        draftMessage: starterDraft(c),
        status: 'pending',
        sentAt: null,
      }))
      manatalState.ok = true
      manatalState.count = pulled.length
    } else {
      manatalState.ok = true
      manatalState.count = 0
    }
  } catch (err) {
    manatalState.error = err.message
  }
}

const makeId = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 10)}`

const app = express()
app.use(express.json())

// Pull Manatal data before serving any read.
app.use(async (_req, _res, next) => {
  await ensureManatal()
  next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/connections', (_req, res) => {
  res.json({
    manatal: hasManatalKey() ? 'connected' : 'not connected',
    deepseek: hasDeepSeekKey() ? 'connected' : 'not connected',
  })
})

// Surface how the live Manatal pull went (used by Settings).
app.get('/api/manatal/status', (_req, res) => res.json(manatalState))

app.get('/api/accounts', (_req, res) => res.json(getDb().accounts))
app.get('/api/candidates', (_req, res) => res.json(getDb().candidates))

app.patch('/api/candidates/:id', (req, res) => {
  const c = getDb().candidates.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: 'Candidate not found' })
  Object.assign(c, req.body)
  res.json(c)
})

app.get('/api/queue', (_req, res) => res.json(getDb().queue))

app.patch('/api/queue/:id', (req, res) => {
  const d = getDb()
  const item = d.queue.find((q) => q.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Queue item not found' })
  const { status, draftMessage: newDraft } = req.body
  if (typeof newDraft === 'string') item.draftMessage = newDraft
  if (status === 'sent') {
    const account = d.accounts.find((a) => a.id === item.accountId)
    if (account.dailyQuotaUsed >= LIMITS.dailyMax)
      return res.status(409).json({ error: 'blocked', reason: `${account.name} hit the daily limit of ${LIMITS.dailyMax}.` })
    if (account.weeklyQuotaUsed >= LIMITS.weeklyMax)
      return res.status(409).json({ error: 'blocked', reason: `${account.name} hit the weekly limit of ${LIMITS.weeklyMax}.` })
    item.status = 'sent'
    item.sentAt = new Date().toISOString()
    account.dailyQuotaUsed += 1
    account.weeklyQuotaUsed += 1
    const cand = d.candidates.find((c) => c.id === item.candidateId)
    if (cand && cand.stage !== 'invited') cand.stage = 'invited'
  } else if (status) {
    item.status = status
    if (status === 'pending') item.sentAt = null
  }
  res.json(item)
})

app.get('/api/replies', (_req, res) => res.json(getDb().replies))
app.post('/api/replies', (req, res) => {
  const reply = {
    id: makeId('reply'),
    candidateId: req.body.candidateId || null,
    text: req.body.text || '',
    classification: req.body.classification || 'needs follow up',
    receivedAt: req.body.receivedAt || new Date().toISOString(),
  }
  getDb().replies.push(reply)
  res.json(reply)
})

app.get('/api/settings', (_req, res) => res.json(getDb().settings))
app.patch('/api/settings', (req, res) => {
  const d = getDb()
  d.settings = { ...d.settings, ...req.body }
  res.json(d.settings)
})

app.get('/api/stats', (_req, res) => {
  const d = getDb()
  const invitesThisWeek = d.accounts.reduce((s, a) => s + a.weeklyQuotaUsed, 0)
  const weeklyCapacity = d.accounts.length * LIMITS.weeklyMax
  const accepted = d.candidates.filter((c) => ['accepted', 'replied', 'interview'].includes(c.stage)).length
  const invited = d.candidates.filter((c) => ['invited', 'accepted', 'replied', 'interview'].includes(c.stage)).length
  const byStage = d.candidates.reduce((acc, c) => ((acc[c.stage] = (acc[c.stage] || 0) + 1), acc), {})
  res.json({
    invitesThisWeek,
    remainingWeeklyQuota: Math.max(weeklyCapacity - invitesThisWeek, 0),
    weeklyCapacity,
    acceptanceRate: invited ? Math.round((accepted / invited) * 100) : 0,
    repliesReceived: d.replies.length,
    byStage,
    activity: d.activity,
  })
})

app.post('/api/ai/message', async (req, res) => {
  const d = getDb()
  const candidate = d.candidates.find((c) => c.id === req.body.candidateId)
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' })
  res.json(await draftMessage(candidate, req.body.tone || d.settings.tone))
})

app.post('/api/ai/classify', async (req, res) => {
  if (!req.body.text) return res.status(400).json({ error: 'text is required' })
  res.json(await classifyReply(req.body.text))
})

// Manually re-pull from Manatal.
app.post('/api/manatal/sync', async (_req, res) => {
  if (!hasManatalKey())
    return res.status(400).json({ error: 'no_key', reason: 'Set MANATAL_API_KEY in Vercel → Settings → Environment Variables, then redeploy.' })
  manatalState = { attempted: false, ok: false, count: 0, error: null }
  await ensureManatal()
  if (manatalState.error) return res.status(502).json({ error: 'manatal_failed', reason: manatalState.error })
  res.json({ ok: true, count: manatalState.count })
})

app.post('/api/reset', (_req, res) => {
  db = buildSeed()
  manatalState = { attempted: false, ok: false, count: 0, error: null }
  res.json({ ok: true })
})

export default app
