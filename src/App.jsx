import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ToastProvider } from './components/Toast.jsx'
import Layout from './components/Layout.jsx'
import Login from './screens/Login.jsx'
import Dashboard from './screens/Dashboard.jsx'
import SendQueue from './screens/SendQueue.jsx'
import AccountHealth from './screens/AccountHealth.jsx'
import Pipeline from './screens/Pipeline.jsx'
import Settings from './screens/Settings.jsx'
import { getAuthConfig, getToken, logout as doLogout } from './lib/data.js'

const SCREENS = {
  dashboard: Dashboard,
  queue: SendQueue,
  health: AccountHealth,
  pipeline: Pipeline,
  settings: Settings,
}

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const [auth, setAuth] = useState({ checked: false, required: false, demo: false, ok: false, forced: false })

  // On load, ask the backend whether a login is required, and whether we
  // already hold a token.
  useEffect(() => {
    getAuthConfig()
      .then((cfg) => {
        const required = Boolean(cfg.authRequired)
        setAuth((a) => ({
          ...a,
          checked: true,
          required,
          demo: Boolean(cfg.demo),
          ok: !required || Boolean(getToken()),
        }))
      })
      // If we can't even reach the config endpoint, still let the 401 handler
      // below force a login rather than getting stuck on a blank/loading screen.
      .catch(() => setAuth((a) => ({ ...a, checked: true, required: false, demo: false, ok: true })))
  }, [])

  // If ANY API call reports 401, drop straight to the login screen — even if we
  // couldn't detect auth up front. This prevents ever being stranded on the
  // loading skeletons when a token is missing, stale, or expired.
  useEffect(() => {
    const onUnauth = () => setAuth((a) => ({ ...a, forced: true, ok: false }))
    window.addEventListener('oc-unauthorized', onUnauth)
    return () => window.removeEventListener('oc-unauthorized', onUnauth)
  }, [])

  const handleLogout = useCallback(() => {
    doLogout()
    setAuth((a) => ({ ...a, forced: true, ok: false }))
    setScreen('dashboard')
  }, [])

  // Nothing until we know whether auth is needed (avoids a login flash).
  if (!auth.checked) return <div className="min-h-screen bg-base-800" />

  if ((auth.required && !auth.ok) || auth.forced) {
    return (
      <ToastProvider>
        <Login
          demo={auth.demo}
          onSuccess={() => setAuth((a) => ({ ...a, ok: true, forced: false }))}
        />
      </ToastProvider>
    )
  }

  const Current = SCREENS[screen]
  return (
    <ToastProvider>
      <Layout
        current={screen}
        onNavigate={setScreen}
        onLogout={auth.required ? handleLogout : null}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Current onNavigate={setScreen} />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </ToastProvider>
  )
}
