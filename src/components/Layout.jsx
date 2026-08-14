import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Send,
  HeartPulse,
  KanbanSquare,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import AuroraBackground from './AuroraBackground.jsx'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'queue', label: 'Send Queue', icon: Send },
  { key: 'health', label: 'Account Health', icon: HeartPulse },
  { key: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

export { NAV }

export default function Layout({ current, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavList = ({ onClick }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = current === item.key
        return (
          <button
            key={item.key}
            onClick={() => {
              onNavigate(item.key)
              onClick?.()
            }}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active ? 'text-ink' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-accent/15 ring-1 ring-accent/30"
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              />
            )}
            <Icon size={18} className={`relative z-10 ${active ? 'text-amber-600' : ''}`} />
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      <AuroraBackground />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-base-900/60 p-5 backdrop-blur-xl lg:flex">
        <Brand />
        <div className="mt-8">
          <NavList />
        </div>
        <Footer onLogout={onLogout} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-black/5 bg-base-900/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand compact />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-black/5"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-black/10 bg-base-900 p-5 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-black/5"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-8">
                <NavList onClick={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}

function Brand({ compact }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
        <span className="absolute inset-0 rounded-xl bg-accent/20 blur-md" />
        <Send size={17} className="relative text-amber-600" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-ink">Outreach</p>
          <p className="text-[11px] font-medium text-slate-500">Command Center</p>
        </div>
      )}
      {compact && <p className="text-sm font-bold text-ink">Outreach CC</p>}
    </div>
  )
}

function Footer({ onLogout }) {
  return (
    <div className="mt-auto space-y-2 pt-6">
      {onLogout && (
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-black/[0.05] hover:text-slate-800"
        >
          <LogOut size={18} /> Sign out
        </button>
      )}
      <div className="glass p-3">
        <p className="text-[11px] font-semibold text-slate-600">EX Venture</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Recruiting outreach · human-sent</p>
      </div>
    </div>
  )
}
