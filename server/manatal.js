// ---------------------------------------------------------------------------
// Manatal integration. Runs ONLY on the server, so the API key stays private.
//
// Pulls candidates from your Manatal account (Open API v3) and maps them into
// the app's Candidate shape. Manatal profiles include a photo, headline,
// current company, location and skills — so once this runs, the cards show real
// faces and real data instead of the generated seed avatars.
//
// Docs: https://api.manatal.com/open/v3/   (auth header: "Authorization: Token <key>")
// ---------------------------------------------------------------------------
const BASE = 'https://api.manatal.com/open/v3'

export function hasManatalKey() {
  return Boolean(process.env.MANATAL_API_KEY)
}

export async function fetchManatalCandidates({ limit = 40 } = {}) {
  if (!hasManatalKey()) throw new Error('MANATAL_API_KEY is not set in .env')

  const res = await fetch(`${BASE}/candidates/?page_size=${limit}`, {
    headers: {
      Authorization: `Token ${process.env.MANATAL_API_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Manatal API ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapCandidate).filter((c) => c.name)
}

// Manatal field names vary by account/version, so read defensively.
function mapCandidate(c) {
  const name =
    c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || ''
  const headline = c.headline || c.current_position || c.job_title || ''
  const company = c.current_employer || c.current_company || c.employer || ''
  const location =
    c.address ||
    c.location ||
    [c.city, c.country].filter(Boolean).join(', ') ||
    ''
  const photoUrl = c.avatar || c.photo || c.picture || c.profile_picture || ''
  const profileUrl =
    c.linkedin_url ||
    c.linkedin ||
    (c.social_media && c.social_media.linkedin) ||
    (name ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}` : '')
  const skills = (c.skills || [])
    .map((s) => (typeof s === 'string' ? s : s.name || s.skill))
    .filter(Boolean)
    .slice(0, 3)
  const summary =
    c.summary || c.description || c.about || headline || 'Profile synced from Manatal.'

  return {
    manatalId: String(c.id ?? c.reference ?? ''),
    name,
    headline,
    company,
    location,
    profileUrl,
    photoUrl,
    skills,
    enrichmentSummary: summary,
    // Manatal may expose a match/score; otherwise give a sensible default.
    matchScore: clampScore(c.score ?? c.match_score ?? 78 + ((hashId(c.id) % 20))),
    stage: 'sourced',
  }
}

function clampScore(n) {
  const v = Number(n) || 0
  return Math.max(50, Math.min(99, Math.round(v)))
}
function hashId(id) {
  const s = String(id ?? '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

// A simple first draft so the Send Queue isn't empty right after a sync.
// (DeepSeek replaces this when the user clicks Regenerate.)
export function starterDraft(c) {
  const firstName = (c.name || '').split(' ')[0] || 'there'
  const hook = (c.enrichmentSummary || '').split('.')[0]
  const lower = hook ? hook.charAt(0).toLowerCase() + hook.slice(1) : 'your work'
  return `Hi ${firstName} — ${lower} stood out. I'm helping EX Venture grow its engineering team and would love to connect.`.slice(
    0,
    300,
  )
}
