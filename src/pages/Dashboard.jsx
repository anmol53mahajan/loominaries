import { useState } from 'react'
import MissionBrief from '../components/MissionBrief'
import { useCommittee } from '../hooks/useCommittee'

function validateFields(values) {
  if (!values.committeeName.trim()) {
    return 'Please enter your committee name.'
  }

  if (!values.portfolio.trim()) {
    return 'Please enter your portfolio (country).'
  }

  if (!values.agenda.trim()) {
    return 'Please enter your agenda.'
  }

  return ''
}

export default function Dashboard() {
  const {
    committeeName,
    portfolio,
    agenda,
    loading,
    hasCommitteeData,
    saveCommitteeData,
  } = useCommittee()

  const [formValues, setFormValues] = useState({
    committeeName: committeeName || '',
    portfolio: portfolio || '',
    agenda: agenda || '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateFields(formValues)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsSaving(true)

    try {
      await saveCommitteeData({
        committeeName: formValues.committeeName.trim(),
        portfolio: formValues.portfolio.trim(),
        agenda: formValues.agenda.trim(),
      })
    } catch (saveError) {
      console.error('Failed to save committee setup:', saveError)
      setError('We could not save your mission brief. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="saas-card min-h-[300px]">
        <div className="space-y-3">
          <div className="h-4 w-44 animate-pulse rounded bg-zinc-900" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-900" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-900" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-zinc-900" />
        </div>
      </div>
    )
  }

  if (hasCommitteeData) {
    return (
      <section className="space-y-5 text-white">
        <header className="saas-card">
          <p className="text-xs uppercase tracking-[0.26em] text-indigo-400">Overview</p>
          <h2 className="mt-2 text-3xl font-semibold">Mission Dashboard</h2>
          <p className="mt-2 text-sm text-zinc-400">Your committee configuration is active across Research, Live, Alliance, and Notepad.</p>
        </header>

        <MissionBrief committeeName={committeeName} portfolio={portfolio} agenda={agenda} />
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl saas-card text-white md:p-8">
      <header className="mb-7">
        <p className="text-xs uppercase tracking-[0.26em] text-indigo-400">Setup</p>
        <h2 className="mt-2 text-3xl font-semibold">Set Up Your Mission</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Add your committee details once. Loominaries will use this context for better AI assistance.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="committeeName" className="mb-2 block text-sm font-medium text-zinc-300">
            Committee Name
          </label>
          <input
            id="committeeName"
            name="committeeName"
            value={formValues.committeeName}
            onChange={handleChange}
            placeholder="e.g. United Nations Security Council"
            className="saas-input"
          />
        </div>

        <div>
          <label htmlFor="portfolio" className="mb-2 block text-sm font-medium text-zinc-300">
            Portfolio (Country)
          </label>
          <input
            id="portfolio"
            name="portfolio"
            value={formValues.portfolio}
            onChange={handleChange}
            placeholder="e.g. Japan"
            className="saas-input"
          />
        </div>

        <div>
          <label htmlFor="agenda" className="mb-2 block text-sm font-medium text-zinc-300">
            Agenda
          </label>
          <textarea
            id="agenda"
            name="agenda"
            rows={4}
            value={formValues.agenda}
            onChange={handleChange}
            placeholder="e.g. Addressing emerging cybersecurity threats to international peace"
            className="saas-input"
          />
        </div>

        {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="saas-btn-primary w-full sm:w-auto"
        >
          {isSaving ? 'Saving mission brief...' : 'Save mission brief'}
        </button>
      </form>
    </section>
  )
}
