// ===========================================================================
//  src/lib/data.js  —  THE SINGLE DATA LAYER
// ===========================================================================
//
//  Every read and write in the entire app goes through THIS file. No React
//  component calls fetch() or an API directly. That means when you move to
//  Base44, you edit ONLY this file and nothing else.
//
//  ---------------------------------------------------------------------------
//  HOW IT WORKS TODAY (local development)
//  ---------------------------------------------------------------------------
//  Each function below calls our own Node/Express backend at /api/*.
//  The backend holds the API keys and talks to Manatal / DeepSeek. The browser
//  never sees a key.
//
//  ---------------------------------------------------------------------------
//  HOW TO SWITCH TO BASE44  (do this later, in this file only)
//  ---------------------------------------------------------------------------
//  Base44 gives you "entities" with methods like:
//      import { Account, Candidate, QueueItem, Reply } from '@/entities'
//      Account.list()                     // -> getAccounts()
//      Candidate.list()                   // -> getCandidates()
//      Candidate.update(id, { stage })    // -> updateCandidate(id, patch)
//      QueueItem.list()                   // -> getQueue()
//      QueueItem.update(id, { status })   // -> updateQueueItem(id, patch)
//      Reply.create({ ... })              // -> saveReply(...)
//
//  For each function below there is a "// BASE44:" comment showing the single
//  line you would swap in. Replace the fetch() body with that line, delete the
//  helper at the top, and the rest of the app keeps working untouched.
//
//  The AI calls (generateMessage / classifyReply) should stay behind a server
//  or a Base44 backend function so the DeepSeek key is never in the browser —
//  point them at your Base44 function URL instead of /api.
// ===========================================================================

const API = '/api'
const TOKEN_KEY = 'oc_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
}
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

// Small helper used only by the local fetch implementation. When you move to
// Base44 you can delete this — Base44 entities are called directly.
async function api(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (res.status === 401) {
    // Token missing/expired — drop it and tell the app to show the login page.
    logout()
    window.dispatchEvent(new Event('oc-unauthorized'))
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.reason || body.error || `Request failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
export function getAuthConfig() {
  // BASE44:  Base44 has its own auth — return { authRequired: false }.
  return api('/auth/config')
}

export async function login(username, password) {
  const { token } = await api('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(token)
  return true
}

// ---------------------------------------------------------------------------
// ACCOUNTS
// ---------------------------------------------------------------------------
export function getAccounts() {
  // BASE44:  return Account.list()
  return api('/accounts')
}

// ---------------------------------------------------------------------------
// CANDIDATES
// ---------------------------------------------------------------------------
export function getCandidates() {
  // BASE44:  return Candidate.list()
  return api('/candidates')
}

export function updateCandidate(id, patch) {
  // BASE44:  return Candidate.update(id, patch)
  return api(`/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

// ---------------------------------------------------------------------------
// SEND QUEUE
// ---------------------------------------------------------------------------
export function getQueue() {
  // BASE44:  return QueueItem.list()
  return api('/queue')
}

// patch may include { status: 'sent' | 'skipped' | 'pending', draftMessage }.
// The BACKEND enforces the per-account daily/weekly hard limits when status is
// 'sent' and throws a blocking error you can show the user. Keep that logic on
// the server (or a Base44 backend function) so it can't be bypassed.
export function updateQueueItem(id, patch) {
  // BASE44:  return QueueItem.update(id, patch)   (enforce limits in a hook)
  return api(`/queue/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

// ---------------------------------------------------------------------------
// REPLIES
// ---------------------------------------------------------------------------
export function getReplies() {
  // BASE44:  return Reply.list()
  return api('/replies')
}

export function saveReply(reply) {
  // BASE44:  return Reply.create(reply)
  return api('/replies', { method: 'POST', body: JSON.stringify(reply) })
}

// ---------------------------------------------------------------------------
// SETTINGS  (templates, tone, daily target)
// ---------------------------------------------------------------------------
export function getSettings() {
  // BASE44:  return Setting.list().then(rows => rows[0])
  return api('/settings')
}

export function updateSettings(patch) {
  // BASE44:  return Setting.update(id, patch)
  return api('/settings', { method: 'PATCH', body: JSON.stringify(patch) })
}

// ---------------------------------------------------------------------------
// DASHBOARD STATS  (aggregated server-side)
// ---------------------------------------------------------------------------
export function getStats() {
  // BASE44:  compute from entity lists, or call a backend function
  return api('/stats')
}

// ---------------------------------------------------------------------------
// CONNECTION STATUS  (are the API keys configured?)
// ---------------------------------------------------------------------------
export function getConnections() {
  // BASE44:  return { manatal, deepseek } from your backend
  return api('/connections')
}

// ---------------------------------------------------------------------------
// AI  —  these MUST stay server-side so the DeepSeek key stays private.
// ---------------------------------------------------------------------------

// Draft / regenerate a personalised opening message for a candidate.
export function generateMessage(candidateId, tone) {
  // BASE44:  return base44.functions.draftMessage({ candidateId, tone })
  return api('/ai/message', {
    method: 'POST',
    body: JSON.stringify({ candidateId, tone }),
  })
}

// Classify an incoming reply (interested / not interested / needs follow up).
export function classifyReply(text, candidateId) {
  // BASE44:  return base44.functions.classifyReply({ text, candidateId })
  return api('/ai/classify', {
    method: 'POST',
    body: JSON.stringify({ text, candidateId }),
  })
}

// ---------------------------------------------------------------------------
// MANATAL — pull real candidates. Must stay server-side (key is private).
// ---------------------------------------------------------------------------
export function syncFromManatal() {
  // BASE44:  return base44.functions.manatalSync()
  return api('/manatal/sync', { method: 'POST' })
}

// ---------------------------------------------------------------------------
// DEV ONLY: reset the seed data. Remove once you are on Base44.
// ---------------------------------------------------------------------------
export function resetDemoData() {
  return api('/reset', { method: 'POST' })
}
