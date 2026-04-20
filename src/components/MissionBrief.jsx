export default function MissionBrief({ committeeName, portfolio, agenda, className = '' }) {
  return (
    <article
      className={[
        'saas-card saas-card-glow',
        className,
      ].join(' ')}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">Mission Brief</h3>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          Active
        </span>
      </div>

      <dl className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Committee</dt>
          <dd className="mt-1 text-base font-semibold text-white">{committeeName}</dd>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Portfolio</dt>
          <dd className="mt-1 text-base font-semibold text-white">{portfolio}</dd>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Agenda</dt>
          <dd className="mt-1 text-base font-semibold text-white">{agenda}</dd>
        </div>
      </dl>
    </article>
  )
}
