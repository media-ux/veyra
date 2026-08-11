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
  const [auth, setAuth] = useState({ checked: false, required: false, demo: false, ok: false })

  // On load, ask the backend whether a login is required, and whether we
  // already hold a token.
  useEffect(() => {
    getAuthConfig()
      .then((cfg) => {
        const required = Boolean(cfg.authRequired)
        setAuth({
          checked: true,
          required,
          demo: Boolean(cfg.demo),
          ok: !required || Boolean(getToken()),
        })
      })
      .catch(() => setAuth({ checked: true, required: false, demo: false, ok: true }))
  }, [])

  // If any API call reports 401, drop back to the login screen.
  useEffect(() => {
    const onUnauth = () => setAuth((a) => ({ ...a, ok: false }))
    window.addEventListener('oc-unauthorized', onUnauth)
    return () => window.removeEventListener('oc-unauthorized', onUnauth)
  }, [])

  const handleLogout = useCallback(() => {
    doLogout()
    setAuth((a) => ({ ...a, ok: false }))
    setScreen('dashboard')
  }, [])

  // Nothing until we know whether auth is needed (avoids a login flash).
  if (!auth.checked) return <div className="min-h-screen bg-base-800" />

  if (auth.required && !auth.ok) {
    return (
      <ToastProvider>
        <Login demo={auth.demo} onSuccess={() => setAuth((a) => ({ ...a, ok: true }))} />
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
