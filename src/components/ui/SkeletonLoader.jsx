export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-line-${index}`}
          className="h-4 animate-pulse rounded bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"
          style={{
            width: index === lines - 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  )
}
