export default function ProgressBar({ value = 0, total = 0, label = '', className = '' }) {
  const safeTotal = total > 0 ? total : 1
  const safeValue = Math.max(0, Math.min(value, safeTotal))
  const percentage = Math.round((safeValue / safeTotal) * 100)

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>{label}</span>
          <span>{safeValue} / {total} Allies</span>
        </div>
      )}

      <div className="h-3 overflow-hidden rounded-full bg-slate-700/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
