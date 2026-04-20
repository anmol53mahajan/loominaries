import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { Users, Vote, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { db } from '../services/firebase'
import ProgressBar from '../components/ui/ProgressBar'
import { useAllianceStats } from '../hooks/useAllianceStats'

const SENTIMENT_OPTIONS = [
  { value: 'ally', label: 'Ally', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
  { value: 'neutral', label: 'Neutral', className: 'border-slate-600 bg-slate-700/60 text-slate-200' },
  { value: 'opponent', label: 'Opponent', className: 'border-rose-500/30 bg-rose-500/10 text-rose-200' },
]

const VOTE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'abstain', label: 'Abstain' },
]

function normalizeCountryName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

const CountryCard = memo(function CountryCard({ country, onSentimentChange, onVoteChange, onDelete }) {
  const sentimentMeta = SENTIMENT_OPTIONS.find((option) => option.value === country.sentiment) || SENTIMENT_OPTIONS[1]

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm transition hover:border-slate-600">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{country.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Voting position</p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(country.id)}
          className="rounded-lg border border-slate-600 p-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
          aria-label={`Delete ${country.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>Sentiment</span>
            <span className={`rounded-full border px-2.5 py-1 ${sentimentMeta.className}`}>{sentimentMeta.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SENTIMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSentimentChange(country.id, option.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-[0.99] ${
                  country.sentiment === option.value
                    ? option.className
                    : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>Vote</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-1 text-slate-200">
              <Vote className="h-3.5 w-3.5" />
              {country.vote}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VOTE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onVoteChange(country.id, option.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-[0.99] ${
                  country.vote === option.value
                    ? 'border-blue-400/40 bg-blue-500/15 text-blue-100'
                    : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
})

export default function Alliance() {
  const { user } = useAuth()
  const [countries, setCountries] = useState([])
  const [countryName, setCountryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setCountries([])
      setLoading(false)
      return () => {}
    }

    setLoading(true)
    const countriesQuery = query(collection(db, 'countries'), where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(
      countriesQuery,
      (snapshot) => {
        setCountries(
          snapshot.docs.map((countryDoc) => ({
            id: countryDoc.id,
            ...countryDoc.data(),
          })),
        )
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Failed to load alliance tracker:', snapshotError)
        setError('Unable to load alliance tracker right now.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const stats = useAllianceStats(countries)

  const handleAddCountry = useCallback(async () => {
    const cleanName = normalizeCountryName(countryName)

    if (!cleanName) {
      setError('Please enter a country name.')
      return
    }

    const duplicate = countries.some((country) => country.name.toLowerCase() === cleanName.toLowerCase())

    if (duplicate) {
      setError('That country already exists in the tracker.')
      return
    }

    if (!user) {
      setError('Please login again to add countries.')
      return
    }

    setError('')

    try {
      await addDoc(collection(db, 'countries'), {
        userId: user.uid,
        name: cleanName,
        sentiment: 'neutral',
        vote: 'abstain',
        createdAt: serverTimestamp(),
      })

      setCountryName('')
      toast.success(`${cleanName} added to tracker`)
    } catch (addError) {
      console.error('Add country failed:', addError)
      setError('Could not add country. Try again.')
    }
  }, [countries, countryName, user])

  const handleSentimentChange = useCallback(async (id, sentiment) => {
    try {
      await updateDoc(doc(db, 'countries', id), { sentiment })
      toast.success('Sentiment updated')
    } catch (updateError) {
      console.error('Update sentiment failed:', updateError)
      toast.error('Could not update sentiment.')
    }
  }, [])

  const handleVoteChange = useCallback(async (id, vote) => {
    try {
      await updateDoc(doc(db, 'countries', id), { vote })
      toast.success('Vote updated')
    } catch (updateError) {
      console.error('Update vote failed:', updateError)
      toast.error('Could not update vote.')
    }
  }, [])

  const handleDeleteCountry = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'countries', id))
      toast.success('Country removed')
    } catch (deleteError) {
      console.error('Delete country failed:', deleteError)
      toast.error('Could not delete country.')
    }
  }, [])

  return (
    <section className="space-y-5 text-white">
      <header className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Alliance Tracker</h2>
            <p className="mt-1 text-sm text-slate-300">Diplomatic CRM for alliances, opposition, and voting patterns.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">
            <Users className="h-4 w-4" />
            {stats.totalCountries} tracked countries
          </div>
        </div>

        {(error || !user) && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error || 'Please login to manage your tracker.'}
          </div>
        )}
      </header>

      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={countryName}
            onChange={(event) => setCountryName(event.target.value)}
            placeholder="Add country to tracker"
            className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
          />
          <button
            type="button"
            onClick={handleAddCountry}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99]"
          >
            Add Country
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`country-skeleton-${index}`} className="h-56 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/70" />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300 shadow-sm">
              <p className="text-lg font-semibold text-white">Add your first country to begin</p>
              <p className="mt-2 text-sm text-slate-400">Track allies, opponents, and voting behavior in real time.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {countries.map((country) => (
                <CountryCard
                  key={country.id}
                  country={country}
                  onSentimentChange={handleSentimentChange}
                  onVoteChange={handleVoteChange}
                  onDelete={handleDeleteCountry}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-white">Bloc Strength</h3>
            <p className="mt-1 text-sm text-slate-300">Measure your current alliance network against total committees.</p>

            <div className="mt-4 space-y-3">
              <ProgressBar
                value={stats.alliesCount}
                total={stats.totalCountries}
                label={`${stats.alliesCount} / ${stats.totalCountries} Allies`}
              />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Allies</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">{stats.alliesCount}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Opponents</p>
                  <p className="mt-1 text-lg font-semibold text-rose-300">{stats.opponentsCount}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Neutral</p>
                  <p className="mt-1 text-lg font-semibold text-slate-200">{stats.neutralCount}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Majority</p>
                  <p className="mt-1 text-lg font-semibold text-blue-300">{stats.majority}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Path to Majority</p>
                <p className="mt-1">You need {Math.max(stats.majority - stats.alliesCount, 0)} more ally(s) to reach majority.</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-white">Quick Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Majority formula: floor(total / 2) + 1</p>
              <p>Use sentiment and voting patterns to prioritize bloc-building.</p>
              <p>Update one country at a time for better diplomatic targeting.</p>
            </div>
          </article>
        </aside>
      </section>
    </section>
  )
}
