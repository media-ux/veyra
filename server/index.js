// ---------------------------------------------------------------------------
// Node/Express backend.
//
// This is the ONLY thing that ever holds API keys or talks to Manatal /
// DeepSeek. The React app talks exclusively to this server over /api/*.
//
// It also enforces the safety rules (per-account daily/weekly hard limits) so
// they cannot be bypassed from the browser.
// ---------------------------------------------------------------------------
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { read, write, reset, makeId } from './store.js'
import { draftMessage, classifyReply, hasDeepSeekKey } from './ai.js'
import { fetchManatalCandidates, hasManatalKey, starterDraft } from './manatal.js'
import { authRequired, checkCredentials, makeToken, requireAuth } from './auth.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5174

// --- Public routes (no login needed) ----------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Tells the frontend whether to show the login screen.
app.get('/api/auth/config', (_req, res) => res.json({ authRequired: authRequired(), demo: false }))

// Exchange username + password for a signed token.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (checkCredentials(username, password)) return res.json({ token: makeToken() })
  return res.status(401).json({ error: 'invalid', reason: 'Wrong username or password.' })
})

// --- Everything below this line requires a valid token (when auth is on) -----
app.use(requireAuth)

// Report whether keys are configured (so Settings can show connection status)
// WITHOUT ever exposing the key values themselves.
app.get('/api/connections', (_req, res) => {
  res.json({
    manatal: hasManatalKey() ? 'connected' : 'not connected',
    deepseek: hasDeepSeekKey() ? 'connected' : 'not connected',
  })
})

// Pull real candidates from Manatal and replace the candidate list + rebuild
// the send queue. Requires MANATAL_API_KEY in .env. Returns a clear error if
// the key is missing or the API call fails.
app.post('/api/manatal/sync', async (_req, res) => {
  if (!hasManatalKey()) {
    return res.status(400).json({ error: 'no_key', reason: 'Add MANATAL_API_KEY to .env, then restart.' })
  }
  try {
    const pulled = await fetchManatalCandidates({ limit: 40 })
    if (pulled.length === 0) {
      return res.status(200).json({ ok: true, count: 0, reason: 'No candidates returned from Manatal.' })
    }
    const db = read()
    const accounts = db.accounts
    const candidates = pulled.map((c, i) => ({
      id: `cand_m${i + 1}`,
      assignedAccount: accounts[i % accounts.length].id,
      ...c,
    }))
    db.candidates = candidates
    db.queue = candidates.map((c, i) => ({
      id: `q_m${i + 1}`,
      candidateId: c.id,
      accountId: c.assignedAccount,
      draftMessage: starterDraft(c),
      status: 'pending',
      sentAt: null,
    }))
    write(db)
    res.json({ ok: true, count: candidates.length })
  } catch (err) {
    res.status(502).json({ error: 'manatal_failed', reason: err.message })
  }
})

// --- Accounts ---------------------------------------------------------------
app.get('/api/accounts', (_req, res) => res.json(read().accounts))

// --- Candidates -------------------------------------------------------------
app.get('/api/candidates', (_req, res) => res.json(read().candidates))

app.patch('/api/candidates/:id', (req, res) => {
  const db = read()
  const c = db.candidates.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: 'Candidate not found' })
  Object.assign(c, req.body)
  write(db)
  res.json(c)
})

// --- Queue ------------------------------------------------------------------
app.get('/api/queue', (_req, res) => res.json(read().queue))

// Update a queue item. When marking as "sent" we enforce the per-account hard
// limits and bump that account's usage + the candidate's stage.
app.patch('/api/queue/:id', (req, res) => {
  const db = read()
  const item = db.queue.find((q) => q.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Queue item not found' })

  const { status, draftMessage: newDraft } = req.body

  if (typeof newDraft === 'string') item.draftMessage = newDraft

  if (status === 'sent') {
    const account = db.accounts.find((a) => a.id === item.accountId)
    if (!account) return res.status(404).json({ error: 'Account not found' })

    // HARD BLOCK — cannot be bypassed from the browser.
    if (account.dailyQuotaUsed >= db.limits.dailyMax) {
      return res.status(409).json({
        error: 'blocked',
        reason: `${account.name} has hit the daily limit of ${db.limits.dailyMax} sends.`,
      })
    }
    if (account.weeklyQuotaUsed >= db.limits.weeklyMax) {
      return res.status(409).json({
        error: 'blocked',
        reason: `${account.name} has hit the weekly limit of ${db.limits.weeklyMax} sends.`,
      })
    }

    item.status = 'sent'
    item.sentAt = new Date().toISOString()
    account.dailyQuotaUsed += 1
    account.weeklyQuotaUsed += 1

    const cand = db.candidates.find((c) => c.id === item.candidateId)
    if (cand && cand.stage !== 'invited') cand.stage = 'invited'
  } else if (status === 'skipped') {
    item.status = 'skipped'
  } else if (status === 'pending') {
    item.status = 'pending'
    item.sentAt = null
  }

  write(db)
  res.json(item)
})

// --- Replies ----------------------------------------------------------------
app.get('/api/replies', (_req, res) => res.json(read().replies))

app.post('/api/replies', (req, res) => {
  const db = read()
  const reply = {
    id: makeId('reply'),
    candidateId: req.body.candidateId || null,
    text: req.body.text || '',
    classification: req.body.classification || 'needs follow up',
    receivedAt: req.body.receivedAt || new Date().toISOString(),
  }
  db.replies.push(reply)
  write(db)
  res.json(reply)
})

// --- Settings ---------------------------------------------------------------
app.get('/api/settings', (_req, res) => res.json(read().settings))

app.patch('/api/settings', (req, res) => {
  const db = read()
  db.settings = { ...db.settings, ...req.body }
  write(db)
  res.json(db.settings)
})

// --- Dashboard stats --------------------------------------------------------
app.get('/api/stats', (_req, res) => {
  const db = read()
  const invitesThisWeek = db.accounts.reduce((s, a) => s + a.weeklyQuotaUsed, 0)
  const weeklyCapacity = db.accounts.length * db.limits.weeklyMax
  const accepted = db.candidates.filter((c) =>
    ['accepted', 'replied', 'interview'].includes(c.stage),
  ).length
  const invited = db.candidates.filter((c) =>
    ['invited', 'accepted', 'replied', 'interview'].includes(c.stage),
  ).length

  const byStage = db.candidates.reduce((acc, c) => {
    acc[c.stage] = (acc[c.stage] || 0) + 1
    return acc
  }, {})

  res.json({
    invitesThisWeek,
    remainingWeeklyQuota: Math.max(weeklyCapacity - invitesThisWeek, 0),
    weeklyCapacity,
    acceptanceRate: invited ? Math.round((accepted / invited) * 100) : 0,
    repliesReceived: db.replies.length,
    byStage,
    activity: db.activity,
  })
})

// --- AI: draft a message ----------------------------------------------------
app.post('/api/ai/message', async (req, res) => {
  const db = read()
  const { candidateId, tone } = req.body
  const candidate = db.candidates.find((c) => c.id === candidateId)
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' })
  const result = await draftMessage(candidate, tone || db.settings.tone)
  res.json(result)
})

// --- AI: classify a reply ---------------------------------------------------
app.post('/api/ai/classify', async (req, res) => {
  const { text, candidateId } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })
  const result = await classifyReply(text)

  // Persist as a Reply record if tied to a candidate.
  if (candidateId) {
    const db = read()
    db.replies.push({
      id: makeId('reply'),
      candidateId,
      text,
      classification: result.classification,
      receivedAt: new Date().toISOString(),
    })
    write(db)
  }
  res.json(result)
})

// --- Reset demo data --------------------------------------------------------
app.post('/api/reset', (_req, res) => res.json({ ok: true, db: reset() }))

app.listen(PORT, () => {
  console.log(`\n  ✔ Outreach Command Center API running on http://localhost:${PORT}`)
  console.log(`    DeepSeek: ${hasDeepSeekKey() ? 'connected' : 'not connected (using local mock)'}`)
  console.log(`    Manatal:  ${process.env.MANATAL_API_KEY ? 'connected' : 'not connected'}\n`)
})
