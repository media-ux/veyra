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

async function manatalGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Token ${process.env.MANATAL_API_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Manatal API ${res.status} on ${path}`)
  return res.json()
}

// Full detail for one candidate: richer profile + uploaded documents (résumé/CV)
// + which job(s) they applied to. Each sub-call is wrapped so a missing piece
// never blocks the rest. Field names are read defensively (Manatal varies).
export async function fetchCandidateDetail(manatalId) {
  if (!hasManatalKey()) throw new Error('MANATAL_API_KEY is not set')
  const id = encodeURIComponent(manatalId)

  const detail = await manatalGet(`/candidates/${id}/`)

  // Diagnostic (field names only, no personal data) so we can map Manatal's
  // actual schema precisely instead of guessing.
  try {
    console.log(
      '[candidate-detail] fields:',
      JSON.stringify({
        keys: Object.keys(detail),
        hasDescription: Boolean(detail.description || detail.summary || detail.about || detail.bio),
        experienceKey: ['experiences', 'work_experience', 'experience'].find((k) => detail[k]),
        educationKey: ['education', 'educations'].find((k) => detail[k]),
        emailKey: ['email_addresses', 'email', 'emails'].find((k) => detail[k]),
      }),
    )
  } catch {
    /* logging must never break the request */
  }

  let documents = []
  try {
    const docs = await manatalGet(`/candidates/${id}/documents/`)
    const rows = Array.isArray(docs) ? docs : docs.results || []
    documents = rows
      .map((d) => ({
        name: d.name || d.filename || d.title || 'Document',
        url: d.file || d.url || d.download_url || d.document || '',
      }))
      .filter((d) => d.url)
  } catch {
    /* no documents endpoint / none uploaded */
  }

  let appliedFor = []
  try {
    const matches = await manatalGet(`/candidates/${id}/matches/`)
    const rows = Array.isArray(matches) ? matches : matches.results || []
    appliedFor = rows
      .map((m) => {
        const job = m.job || m.position || {}
        return job.position_name || job.name || job.title || m.position_name || null
      })
      .filter(Boolean)
  } catch {
    /* no matches / not exposed */
  }

  const mapped = mapCandidate(detail)
  const resume =
    documents.find((d) => /resume|cv|curriculum|résumé/i.test(d.name)) || documents[0] || null

  const pick = (...vals) => vals.find((v) => v != null && v !== '') || ''
  const flat = (v) => (Array.isArray(v) ? v[0] : v)
  const contactVal = (v) => {
    const first = flat(v)
    if (!first) return ''
    return typeof first === 'string' ? first : first.email || first.phone || first.value || ''
  }

  const description = pick(detail.description, detail.summary, detail.about, detail.bio, detail.notes)
  const email = pick(contactVal(detail.email_addresses), detail.email, contactVal(detail.emails))
  const phone = pick(contactVal(detail.phone_numbers), detail.phone, contactVal(detail.phones))
  const currentPosition = pick(detail.current_position, detail.job_title, mapped.headline)
  const source = pick(detail.source, detail.candidate_source)

  const mapHistory = (rows, titleKeys, orgKeys) =>
    (rows || [])
      .map((e) => ({
        title: pick(...titleKeys.map((k) => e[k])),
        org: pick(...orgKeys.map((k) => e[k])),
        period: [e.start_date, e.end_date].filter(Boolean).join(' – '),
      }))
      .filter((x) => x.title || x.org)

  const experience = mapHistory(
    detail.experiences || detail.work_experience || detail.experience,
    ['position', 'title', 'job_title'],
    ['company_name', 'company', 'organization'],
  )
  const education = mapHistory(
    detail.education || detail.educations,
    ['degree', 'field_of_study', 'title'],
    ['school_name', 'school', 'institution', 'organization'],
  )

  return {
    ...mapped,
    manatalId: String(detail.id ?? manatalId),
    documents,
    resumeUrl: resume?.url || detail.resume || detail.cv || null,
    appliedFor,
    description,
    email,
    phone,
    currentPosition,
    source,
    experience,
    education,
  }
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
    .map((s) => (typeof s === 'string' ? s : s.name || s.skill || ''))
    // Drop bare ids/numbers — only keep skills that actually contain letters.
    .filter((s) => s && /[a-zA-Z]/.test(String(s)))
    .slice(0, 6)
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
