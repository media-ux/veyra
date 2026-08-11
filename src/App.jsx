import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ToastProvider } from './components/Toast.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './screens/Dashboard.jsx'
import SendQueue from './screens/SendQueue.jsx'
import AccountHealth from './screens/AccountHealth.jsx'
import Pipeline from './screens/Pipeline.jsx'
import Settings from './screens/Settings.jsx'

const SCREENS = {
  dashboard: Dashboard,
  queue: SendQueue,
  health: AccountHealth,
  pipeline: Pipeline,
  settings: Settings,
}

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const Current = SCREENS[screen]

  return (
    <ToastProvider>
      <Layout current={screen} onNavigate={setScreen}>
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
