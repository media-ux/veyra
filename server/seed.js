// ---------------------------------------------------------------------------
// Seed data so the app is fully usable BEFORE any API keys are added.
// 3 LinkedIn accounts + 20 fake candidates + a ready daily send queue +
// a few incoming replies + 7 days of activity history.
//
// Run `npm run seed` at any time to rebuild server/data/db.json from scratch.
// ---------------------------------------------------------------------------

// Deterministic id helpers (readable ids make the seed data easy to follow).
const cand = (n) => `cand_${String(n).padStart(2, '0')}`
const acct = (n) => `acct_${n}`

const STAGES = ['sourced', 'queued', 'invited', 'accepted', 'replied', 'interview']

const ACCOUNTS = [
  {
    id: acct(1),
    name: 'Aisha Rahman',
    linkedinProfileUrl: 'https://www.linkedin.com/in/aisha-rahman-exv',
    weeklyQuotaUsed: 62,
    dailyQuotaUsed: 11,
    status: 'active',
  },
  {
    id: acct(2),
    name: 'Marco Silva',
    linkedinProfileUrl: 'https://www.linkedin.com/in/marco-silva-exv',
    weeklyQuotaUsed: 88,
    dailyQuotaUsed: 17,
    status: 'active',
  },
  {
    id: acct(3),
    name: 'Priya Nair',
    linkedinProfileUrl: 'https://www.linkedin.com/in/priya-nair-exv',
    weeklyQuotaUsed: 34,
    dailyQuotaUsed: 6,
    status: 'active',
  },
]

// 20 fake candidates with realistic, specific enrichment summaries so the
// message-drafting feels real even before DeepSeek is connected.
const RAW_CANDIDATES = [
  ['Elena Vasquez', 'Senior Frontend Engineer', 'Stripe', 'Berlin, Germany', 'Led the migration of Stripe Checkout to a React Server Components architecture, cutting bundle size 38%. Speaks at ReactConf on rendering performance.', 92, 'invited', 1],
  ['David Okafor', 'Staff Backend Engineer', 'Datadog', 'London, UK', 'Owns the metrics ingestion pipeline handling 2M events/sec. Wrote an internal Go framework now open-sourced with 4k stars.', 88, 'accepted', 1],
  ['Mei Lin', 'ML Platform Engineer', 'Anthropic', 'San Francisco, USA', 'Built the feature store powering model evaluation. Previously scaled recommendation infra at Spotify. PhD in distributed systems.', 95, 'sourced', 3],
  ['Tomasz Kowalski', 'DevOps Lead', 'Revolut', 'Warsaw, Poland', 'Cut cloud spend 41% by re-architecting Kubernetes autoscaling. Runs a popular newsletter on platform engineering.', 84, 'queued', 2],
  ['Sophie Laurent', 'Product Designer', 'Figma', 'Paris, France', 'Designed the multiplayer cursors and comments system. Strong systems-thinking portfolio, writes about design tokens.', 79, 'invited', 2],
  ['Rahul Mehta', 'Senior Data Engineer', 'Airbnb', 'Bangalore, India', 'Rebuilt the batch-to-streaming pipeline on Flink, reducing data latency from hours to seconds. Kafka contributor.', 87, 'replied', 3],
  ['Nina Petrova', 'Security Engineer', 'Cloudflare', 'Lisbon, Portugal', 'Discovered and patched a critical edge-cache poisoning vuln. Regular CTF competitor, blogs on zero-trust design.', 90, 'sourced', 1],
  ['James Whitfield', 'Engineering Manager', 'Monzo', 'Manchester, UK', 'Grew the payments team from 4 to 22 engineers. Advocates for trunk-based development and small PRs.', 81, 'queued', 2],
  ['Yuki Tanaka', 'iOS Engineer', 'Notion', 'Tokyo, Japan', 'Shipped offline-first sync for the mobile app. Deep expertise in SwiftUI performance and Core Data.', 83, 'invited', 3],
  ['Carla Moreno', 'Full-Stack Engineer', 'Vercel', 'Madrid, Spain', 'Core contributor to a widely used Next.js starter. Built edge-rendered dashboards used by 10k+ teams.', 86, 'accepted', 1],
  ['Ahmed Hassan', 'Site Reliability Engineer', 'Shopify', 'Cairo, Egypt', 'On-call lead through three Black Friday peaks with zero customer-facing incidents. Chaos-engineering advocate.', 85, 'sourced', 2],
  ['Freya Andersen', 'Backend Engineer', 'Klarna', 'Stockholm, Sweden', 'Designed the idempotency layer for the payments API. Rust enthusiast, maintains a popular async library.', 82, 'queued', 3],
  ['Lucas Fernandes', 'Data Scientist', 'Nubank', 'São Paulo, Brazil', 'Built the credit-risk model serving 40M customers. Published on causal inference in fintech.', 89, 'invited', 1],
  ['Aria Kapoor', 'Frontend Engineer', 'Linear', 'Amsterdam, Netherlands', 'Obsessive about interaction latency — shipped the sub-16ms command palette. Framer Motion power user.', 91, 'sourced', 2],
  ['Kofi Mensah', 'Platform Engineer', 'GitLab', 'Accra, Ghana', 'Built the internal developer platform reducing service spin-up from days to minutes. Terraform module author.', 80, 'queued', 3],
  ['Isabella Rossi', 'Senior Product Manager', 'Miro', 'Milan, Italy', 'Led the AI features launch that grew activation 27%. Comes from an engineering background.', 77, 'sourced', 1],
  ['Chen Wei', 'Machine Learning Engineer', 'DeepMind', 'Zurich, Switzerland', 'Worked on efficient transformer inference. Two first-author NeurIPS papers on quantization.', 96, 'replied', 3],
  ['Olivia Brooks', 'Growth Engineer', 'Duolingo', 'Pittsburgh, USA', 'Ran 200+ A/B tests on the onboarding funnel, lifting D1 retention 9pts. Loves instrumentation.', 78, 'queued', 2],
  ['Hassan Ali', 'Backend Engineer', 'Careem', 'Dubai, UAE', 'Scaled the ride-matching service for Ramadan surge traffic. Strong on event-driven architecture.', 83, 'sourced', 1],
  ['Emma Novak', 'Design Engineer', 'Framer', 'Prague, Czechia', 'Bridges design and code — built the animation primitives used across the marketing site. Motion design expert.', 88, 'invited', 2],
]

// A few skill tags per candidate, for visual richness on the cards. (When real
// data is synced from Manatal these come from the candidate's Manatal profile.)
const SKILLS = [
  ['React', 'Performance', 'RSC'],
  ['Go', 'Distributed systems', 'Observability'],
  ['ML infra', 'Python', 'Feature stores'],
  ['Kubernetes', 'FinOps', 'Terraform'],
  ['Product design', 'Design systems', 'Figma'],
  ['Flink', 'Kafka', 'Streaming'],
  ['Security', 'Zero-trust', 'CTF'],
  ['Leadership', 'Payments', 'Trunk-based'],
  ['SwiftUI', 'Offline-first', 'Core Data'],
  ['Next.js', 'Edge', 'Full-stack'],
  ['SRE', 'Chaos eng', 'On-call'],
  ['Rust', 'Async', 'Payments'],
  ['Data science', 'Causal inference', 'Risk'],
  ['Framer Motion', 'Latency', 'DX'],
  ['Platform', 'IDP', 'Terraform'],
  ['Product', 'AI features', 'Activation'],
  ['ML', 'Quantization', 'Inference'],
  ['Growth', 'A/B testing', 'Retention'],
  ['Event-driven', 'Scale', 'Backend'],
  ['Design eng', 'Motion', 'Animation'],
]

export function buildSeed() {
  const now = new Date('2026-08-11T09:00:00Z')

  const candidates = RAW_CANDIDATES.map((c, i) => {
    const [name, headline, company, location, enrichmentSummary, matchScore, stage, accountNum] = c
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '-')
    return {
      id: cand(i + 1),
      manatalId: `MAN-${10000 + i}`,
      name,
      headline,
      company,
      location,
      profileUrl: `https://www.linkedin.com/in/${slug}`,
      // Empty until synced from Manatal — the UI shows a generated avatar meanwhile.
      photoUrl: '',
      skills: SKILLS[i] || [],
      enrichmentSummary,
      matchScore,
      stage: STAGES.includes(stage) ? stage : 'sourced',
      assignedAccount: acct(accountNum),
    }
  })

  // Build a daily send queue from candidates in the "queued" stage, plus a few
  // "sourced" ones, so the Send Queue screen has plenty to work through.
  const queueSourceStages = ['queued', 'sourced']
  const queue = candidates
    .filter((c) => queueSourceStages.includes(c.stage))
    .map((c, i) => ({
      id: `q_${String(i + 1).padStart(2, '0')}`,
      candidateId: c.id,
      accountId: c.assignedAccount,
      draftMessage: defaultDraft(c),
      status: 'pending',
      sentAt: null,
    }))

  const replies = [
    {
      id: 'reply_1',
      candidateId: cand(6), // Rahul Mehta
      text: "Thanks for reaching out! The Flink work you mentioned is right up my alley. I'm not actively looking but happy to hear what you're building.",
      classification: 'needs follow up',
      receivedAt: iso(now, -1, 3),
    },
    {
      id: 'reply_2',
      candidateId: cand(17), // Chen Wei
      text: "Appreciate the note. I'd genuinely love to learn more — could you share details on the team and the model-efficiency problems you're tackling?",
      classification: 'interested',
      receivedAt: iso(now, -2, 5),
    },
    {
      id: 'reply_3',
      candidateId: cand(2), // David Okafor
      text: "Thanks but I've just started a new role and I'm not open to moving right now. Best of luck with the search.",
      classification: 'not interested',
      receivedAt: iso(now, -1, 8),
    },
  ]

  // 7 days of activity for the dashboard chart (oldest first).
  const activity = [
    { day: 'Thu', invitesSent: 22, accepted: 6, replies: 2 },
    { day: 'Fri', invitesSent: 31, accepted: 9, replies: 4 },
    { day: 'Sat', invitesSent: 8, accepted: 3, replies: 1 },
    { day: 'Sun', invitesSent: 5, accepted: 1, replies: 0 },
    { day: 'Mon', invitesSent: 38, accepted: 12, replies: 5 },
    { day: 'Tue', invitesSent: 41, accepted: 14, replies: 6 },
    { day: 'Wed', invitesSent: 34, accepted: 10, replies: 3 },
  ]

  const settings = {
    tone: 'warm',
    dailyTargetPerAccount: 15,
    templates: [
      {
        id: 'tpl_1',
        name: 'Warm intro',
        body: "Hi {{firstName}} — really impressed by {{hook}}. I'm helping EX Venture build out its engineering team and thought you might be worth a conversation. Open to connecting?",
      },
      {
        id: 'tpl_2',
        name: 'Direct',
        body: "Hi {{firstName}}, EX Venture is hiring for a role that lines up closely with your work at {{company}}. Worth a quick chat?",
      },
    ],
    // Connection status is derived server-side from whether the .env keys are
    // set; these are just the last-known display values.
    connections: {
      manatal: 'unknown',
      deepseek: 'unknown',
    },
  }

  return {
    accounts: ACCOUNTS,
    candidates,
    queue,
    replies,
    activity,
    settings,
    // Per-account hard limits enforced by the backend and shown on Account Health.
    limits: { dailyMax: 20, weeklyMax: 90, weeklyQuota: 100, dailyTarget: 15 },
  }
}

// A believable default draft that references something specific from the
// candidate's profile — this is what DeepSeek will replace once connected.
function defaultDraft(c) {
  const firstName = c.name.split(' ')[0]
  const hook = c.enrichmentSummary.split('.')[0]
  return `Hi ${firstName} — ${lower(hook)} genuinely stood out. I'm helping EX Venture grow its engineering team and would love to connect.`
}

function lower(s) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

function iso(base, daysAgo, hoursAgo) {
  const d = new Date(base)
  d.setDate(d.getDate() + daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}
