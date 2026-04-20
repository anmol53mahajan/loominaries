'use client'

import { useState } from 'react'
import { useCommitteeContext } from '../context/CommitteeContext'
import toast from 'react-hot-toast'

export default function MissionBrief({ committeeName, portfolio, agenda, className = '' }) {
  const { deleteCommitteeData } = useCommitteeContext()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteMission = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this mission? You will need to enter new committee details to continue.',
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteCommitteeData()
      toast.success('Mission deleted. Ready for a new MUN!')
    } catch (error) {
      console.error('Error deleting mission:', error)
      toast.error('Failed to delete mission. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

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

      <button
        onClick={handleDeleteMission}
        disabled={isDeleting}
        className="mt-6 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all hover:border-red-500/60 hover:bg-red-500/20 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'New Mission (Delete Current)'}
      </button>
    </article>
  )
}
