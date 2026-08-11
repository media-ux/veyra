// Shared display helpers (colours, labels, relative time). Pure functions, no
// data access — that all lives in data.js.

// Colour for a usage percentage: green < 60, amber 60–85, red > 85.
export function usageColor(pct) {
  if (pct > 85) return '#f87171' // red
  if (pct >= 60) return '#fbbf24' // amber
  return '#34d399' // green
}

export function usageState(pct) {
  if (pct > 85) return 'red'
  if (pct >= 60) return 'amber'
  return 'green'
}

// The pipeline stages, in order, with their display metadata.
export const STAGES = [
  { key: 'sourced', label: 'Sourced', color: '#94a3b8' },
  { key: 'queued', label: 'Queued', color: '#5b8cff' },
  { key: 'invited', label: 'Invited', color: '#818cf8' },
  { key: 'accepted', label: 'Accepted', color: '#34d399' },
  { key: 'replied', label: 'Replied', color: '#fbbf24' },
  { key: 'interview', label: 'Interview', color: '#f472b6' },
]

export function stageMeta(key) {
  return STAGES.find((s) => s.key === key) || { key, label: key, color: '#94a3b8' }
}

// Reply classification display metadata.
export const CLASSIFICATIONS = {
  interested: { label: 'Interested', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  'not interested': { label: 'Not interested', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'needs follow up': { label: 'Needs follow up', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
}

export function classificationMeta(key) {
  return CLASSIFICATIONS[key] || CLASSIFICATIONS['needs follow up']
}

// "2h ago", "3d ago" style relative time.
export function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
