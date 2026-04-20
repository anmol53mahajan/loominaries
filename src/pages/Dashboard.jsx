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
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
      </div>
    )
  }

  if (hasCommitteeData) {
    return (
      <section className="space-y-4">
        <header>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-slate-600">Your committee configuration is ready to use across Loominaries.</p>
        </header>

        <MissionBrief committeeName={committeeName} portfolio={portfolio} agenda={agenda} />
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Set Up Your Mission</h2>
        <p className="mt-1 text-slate-600">
          Add your committee details once. Loominaries will use this context for better AI assistance.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="committeeName" className="mb-1 block text-sm font-medium text-slate-700">
            Committee Name
          </label>
          <input
            id="committeeName"
            name="committeeName"
            value={formValues.committeeName}
            onChange={handleChange}
            placeholder="e.g. United Nations Security Council"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label htmlFor="portfolio" className="mb-1 block text-sm font-medium text-slate-700">
            Portfolio (Country)
          </label>
          <input
            id="portfolio"
            name="portfolio"
            value={formValues.portfolio}
            onChange={handleChange}
            placeholder="e.g. Japan"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label htmlFor="agenda" className="mb-1 block text-sm font-medium text-slate-700">
            Agenda
          </label>
          <textarea
            id="agenda"
            name="agenda"
            rows={4}
            value={formValues.agenda}
            onChange={handleChange}
            placeholder="e.g. Addressing emerging cybersecurity threats to international peace"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500 sm:w-auto"
        >
          {isSaving ? 'Saving mission brief...' : 'Save mission brief'}
        </button>
      </form>
    </section>
  )
}
