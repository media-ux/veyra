import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

// A tiny toast notification system exposed via a hook: const toast = useToast()
// then toast.success('Sent'), toast.error('...'), toast.info('...').
const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}
const ACCENTS = {
  success: 'text-good',
  error: 'text-bad',
  info: 'text-amber-600',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => remove(id), 3600)
    },
    [remove],
  )

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="glass pointer-events-auto flex items-start gap-3 p-4"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${ACCENTS[t.type]}`} />
                <p className="flex-1 text-sm text-slate-800">{t.message}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="text-slate-500 transition-colors hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
