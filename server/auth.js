// ---------------------------------------------------------------------------
// Simple, real login for a single-team internal tool. Server-side only.
//
// How it protects your data:
//  - Credentials live in env vars (APP_USERNAME / APP_PASSWORD) — never in code
//    or the browser.
//  - On login the server issues a signed token (HMAC-SHA256). The token can't be
//    forged without the secret, and it expires after 12 hours.
//  - Every data route requires a valid token, so hitting the API directly
//    without logging in returns 401 — the gate can't be bypassed from the browser.
//
// If APP_PASSWORD is NOT set, auth is disabled (handy for local dev and the
// public demo). Set it in Vercel to turn the login on.
// ---------------------------------------------------------------------------
import crypto from 'node:crypto'

const TWELVE_HOURS = 1000 * 60 * 60 * 12

const USERNAME = () => process.env.APP_USERNAME || 'admin'
const PASSWORD = () => process.env.APP_PASSWORD || ''
const SECRET = () => process.env.AUTH_SECRET || process.env.APP_PASSWORD || 'dev-only-secret'

export function authRequired() {
  return Boolean(PASSWORD())
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export function checkCredentials(username, password) {
  if (!authRequired()) return true
  return safeEqual(username || '', USERNAME()) && safeEqual(password || '', PASSWORD())
}

export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TWELVE_HOURS })).toString(
    'base64url',
  )
  const sig = crypto.createHmac('sha256', SECRET()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token) {
  if (!authRequired()) return true
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = crypto.createHmac('sha256', SECRET()).update(payload).digest('base64url')
  if (!safeEqual(sig, expected)) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return Date.now() < exp
  } catch {
    return false
  }
}

// Express middleware: allow the request through only with a valid token.
export function requireAuth(req, res, next) {
  if (!authRequired()) return next()
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (verifyToken(token)) return next()
  return res.status(401).json({ error: 'unauthorized' })
}
