// Skeleton loaders shown while data.js fetches. The shimmer is a moving
// gradient handled purely in CSS via Tailwind's animate-pulse.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />
}

export function KpiSkeleton() {
  return (
    <div className="glass p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-28" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  )
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`glass p-6 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-24 w-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
    </div>
  )
}
