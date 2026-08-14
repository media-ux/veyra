import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { login } from '../lib/data.js'
import AuroraBackground from '../components/AuroraBackground.jsx'

// Full-screen login gate. Shown until the user authenticates. On the public
// demo it accepts admin / demo (a hint is shown); on the real deployment the
// server checks the username/password from your Vercel env vars.
export default function Login({ demo, onSuccess }) {
  const [username, setUsername] = useState(demo ? 'admin' : '')
  const [password, setPassword] = useState(demo ? 'demo' : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await login(username, password)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Login failed')
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="glass w-full max-w-md p-8 sm:p-10"
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
            <span className="absolute inset-0 rounded-2xl bg-accent/20 blur-lg" />
            <Send size={24} className="relative text-amber-600" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-ink">Outreach Command Center</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to continue</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field
            icon={User}
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="admin"
            autoFocus={!demo}
          />
          <Field
            icon={Lock}
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-bad/20 bg-bad/10 px-3 py-2 text-xs font-medium text-bad"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {demo && (
          <p className="mt-5 rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 text-center text-xs text-slate-500">
            Demo preview — sign in with <b className="text-slate-700">admin</b> /{' '}
            <b className="text-slate-700">demo</b>
          </p>
        )}
      </motion.div>
    </div>
  )
}

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, autoFocus }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-black/5 bg-black/[0.03] py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </label>
  )
}
