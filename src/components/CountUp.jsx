import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

// Animated count-up number. Counts from 0 to `value` on mount / when value
// changes. Used by the dashboard KPI cards.
export default function CountUp({ value = 0, duration = 1.4, suffix = '', className = '' }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])

  return (
    <span className={className}>
      {Math.round(display).toLocaleString()}
      {suffix}
    </span>
  )
}
