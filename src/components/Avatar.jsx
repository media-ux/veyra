import { avatarGradient, initials } from '../lib/format.js'

// A candidate avatar. If a real photo URL is available (e.g. synced from
// Manatal), it's shown. Otherwise we render a colourful generated gradient
// portrait with the person's initials — unique and consistent per name, so the
// UI feels populated with "faces" even before real photos exist.
export default function Avatar({ name = '', photoUrl, size = 56, className = '' }) {
  const g = avatarGradient(name)
  const fontSize = Math.round(size * 0.36)

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-2xl object-cover ring-1 ring-white/10 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})`,
        boxShadow: `0 6px 18px -6px ${g.to}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
    >
      {/* soft light bloom to give the flat gradient some depth */}
      <span
        className="pointer-events-none absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)' }}
      />
      <span
        className="relative font-bold text-white/95"
        style={{ fontSize, textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
      >
        {initials(name)}
      </span>
    </div>
  )
}
