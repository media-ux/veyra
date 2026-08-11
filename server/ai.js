// ---------------------------------------------------------------------------
// DeepSeek integration. This file runs ONLY on the server, so the API key
// never reaches the browser.
//
// Two jobs:
//   1) draftMessage()  — write a personalised LinkedIn connection note
//   2) classifyReply() — label an incoming reply
//
// If DEEPSEEK_API_KEY is not set, both functions fall back to a local mock so
// the whole app keeps working before you add any keys.
// ---------------------------------------------------------------------------

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

const TONE_GUIDE = {
  direct: 'Concise and confident. No fluff. One clear reason and one clear ask.',
  warm: 'Friendly and human. Genuine, a little personal, never salesy.',
  technical:
    'Speaks engineer-to-engineer. References the specific technical work credibly.',
}

export function hasDeepSeekKey() {
  return Boolean(process.env.DEEPSEEK_API_KEY)
}

async function callDeepSeek(messages, { maxTokens = 200, temperature = 0.8 } = {}) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ---- 1) Draft a personalised opening message --------------------------------
export async function draftMessage(candidate, tone = 'warm') {
  const toneGuide = TONE_GUIDE[tone] || TONE_GUIDE.warm

  if (!hasDeepSeekKey()) {
    return { message: mockDraft(candidate, tone), source: 'mock' }
  }

  const system = [
    'You write LinkedIn connection notes for a technical recruiter at EX Venture.',
    'Rules:',
    '- Hard limit 300 characters. Aim for 240–290.',
    '- Reference ONE specific, concrete detail from their profile. No generic flattery.',
    '- Sound like a real person, not a template. No emojis. No hashtags.',
    '- End with a light, low-pressure ask to connect.',
    `Tone: ${toneGuide}`,
  ].join('\n')

  const user = [
    `Name: ${candidate.name}`,
    `Headline: ${candidate.headline}`,
    `Company: ${candidate.company}`,
    `Location: ${candidate.location}`,
    `Profile summary: ${candidate.enrichmentSummary}`,
    '',
    'Write only the message text, nothing else.',
  ].join('\n')

  try {
    let message = await callDeepSeek(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { maxTokens: 160, temperature: 0.85 },
    )
    message = message.replace(/^["']|["']$/g, '').slice(0, 300)
    return { message, source: 'deepseek' }
  } catch (err) {
    // Never break the UI because of an API hiccup — fall back to the mock.
    return { message: mockDraft(candidate, tone), source: 'mock', error: err.message }
  }
}

// ---- 2) Classify an incoming reply -----------------------------------------
export async function classifyReply(text) {
  const labels = ['interested', 'not interested', 'needs follow up']

  if (!hasDeepSeekKey()) {
    return { classification: mockClassify(text), source: 'mock' }
  }

  const system =
    'Classify a LinkedIn reply from a candidate into exactly one label: ' +
    '"interested", "not interested", or "needs follow up". ' +
    'Answer with ONLY the label, lowercase, nothing else.'

  try {
    const raw = await callDeepSeek(
      [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
      { maxTokens: 8, temperature: 0 },
    )
    const found = labels.find((l) => raw.toLowerCase().includes(l))
    return { classification: found || 'needs follow up', source: 'deepseek' }
  } catch (err) {
    return { classification: mockClassify(text), source: 'mock', error: err.message }
  }
}

// ---- Local fallbacks (used until DEEPSEEK_API_KEY is set) -------------------
function mockDraft(candidate, tone) {
  const firstName = candidate.name.split(' ')[0]
  const hook = candidate.enrichmentSummary.split('.')[0]
  const openers = {
    direct: `Hi ${firstName}, ${lower(hook)} caught my eye.`,
    warm: `Hi ${firstName} — I came across your work and ${lower(hook)} genuinely stood out.`,
    technical: `Hi ${firstName}, ${lower(hook)} — that's exactly the kind of engineering we care about.`,
  }
  const opener = openers[tone] || openers.warm
  const msg = `${opener} I'm helping EX Venture grow its engineering team and would love to connect.`
  return msg.slice(0, 300)
}

function mockClassify(text) {
  const t = text.toLowerCase()
  if (/\b(not open|no thanks|not interested|just started|not looking)\b/.test(t))
    return 'not interested'
  if (/\b(love to|interested|tell me more|keen|sounds great|share details)\b/.test(t))
    return 'interested'
  return 'needs follow up'
}

function lower(s) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
