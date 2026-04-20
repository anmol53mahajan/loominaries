export default function MissionBrief({ committeeName, portfolio, agenda, className = '' }) {
  return (
    <article
      className={[
        'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm',
        className,
      ].join(' ')}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">Mission Brief</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <dl className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Committee</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{committeeName}</dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{portfolio}</dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{agenda}</dd>
        </div>
      </dl>
    </article>
  )
}
