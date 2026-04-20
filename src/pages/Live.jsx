import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Copy, Loader2, Menu, Plus, Save, Star, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCommittee } from '../hooks/useCommittee'
import { analyzeSpeech } from '../services/ai'
import { db } from '../services/firebase'

function safeParseAnalysis(text) {
  const fallback = { pois: [], poos: [] }

  if (!text?.trim()) {
    return fallback
  }

  const attemptParse = (value) => {
    try {
      const parsed = JSON.parse(value)
      const pois = Array.isArray(parsed?.pois)
        ? parsed.pois.map((item) => String(item).trim()).filter(Boolean)
        : []
      const poos = Array.isArray(parsed?.poos)
        ? parsed.poos.map((item) => String(item).trim()).filter(Boolean)
        : []
      return { pois, poos }
    } catch {
      return null
    }
  }

  const directParse = attemptParse(text)
  if (directParse) {
    return directParse
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return fallback
  }

  return attemptParse(text.slice(start, end + 1)) || fallback
}

function formatHistoryTime(recordedAt) {
  if (!recordedAt) {
    return 'Saved earlier'
  }

  if (typeof recordedAt === 'string' || typeof recordedAt === 'number') {
    const parsedDate = new Date(recordedAt)
    return Number.isNaN(parsedDate.getTime()) ? 'Saved earlier' : parsedDate.toLocaleString()
  }

  if (recordedAt?.toDate) {
    return recordedAt.toDate().toLocaleString()
  }

  return 'Saved earlier'
}

export default function Live() {
  const { user } = useAuth()
  const { agenda, portfolio, countries, sessionLoading, addCountry, togglePoiAsked, removeCountry, recordPoiHistory } = useCommittee()

  const verbatimRef = useRef(null)
  const [speakerCountry, setSpeakerCountry] = useState('')
  const [speechTag, setSpeechTag] = useState('GSL')
  const [wordCount, setWordCount] = useState(0)
  const [pois, setPois] = useState([])
  const [poos, setPoos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countryInput, setCountryInput] = useState('')
  const [selectedPoi, setSelectedPoi] = useState('')
  const [expandedCards, setExpandedCards] = useState({})
  const [trackerOpen, setTrackerOpen] = useState(false)

  const missionBrief = useMemo(
    () => ({ agenda, portfolio }),
    [agenda, portfolio],
  )

  const handleVerbatimInput = useCallback((event) => {
    const text = event.target.value
    const nextWordCount = text.trim().split(/\s+/).filter(Boolean).length
    setWordCount(text.trim() ? nextWordCount : 0)
  }, [])

  const handleAnalyzeSpeech = useCallback(async () => {
    const verbatim = verbatimRef.current?.value || ''

    if (!speakerCountry.trim()) {
      setError('Please enter the speaker country.')
      return
    }

    if (!verbatim.trim()) {
      setError('Please paste or type the delegate speech first.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const rawAnalysis = await analyzeSpeech({
        agenda,
        portfolio,
        speakerCountry,
        verbatim,
      })

      const parsedAnalysis = safeParseAnalysis(rawAnalysis)
      setPois(parsedAnalysis.pois)
      setPoos(parsedAnalysis.poos)
      setSelectedPoi(parsedAnalysis.pois[0] || '')
      setExpandedCards({})

      if (!parsedAnalysis.pois.length && !parsedAnalysis.poos.length) {
        throw new Error('Analysis returned no usable output.')
      }
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError)
      setPois([])
      setPoos([])
      setError('Analysis failed. Try again.')
      toast.error('Analysis failed. Try again.')
    } finally {
      setLoading(false)
    }
  }, [agenda, portfolio, speakerCountry])

  const handleClearSession = useCallback(() => {
    if (verbatimRef.current) {
      verbatimRef.current.value = ''
    }

    setWordCount(0)
    setPois([])
    setPoos([])
    setError('')
    setSpeakerCountry('')
    setSpeechTag('GSL')
    setSelectedPoi('')
    setExpandedCards({})
    setTrackerOpen(false)
  }, [])

  const handleCopy = useCallback(async (text) => {
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Unable to copy. Please copy manually.')
    }
  }, [])

  const handleSaveVerbatim = useCallback(async () => {
    if (!user) {
      toast.error('Please login again to save the speech.')
      return
    }

    const verbatim = verbatimRef.current?.value || ''
    if (!verbatim.trim()) {
      toast.error('No speech text found to save.')
      return
    }

    const cleanSpeaker = speakerCountry.trim() || 'Unknown Delegate'
    const cleanTag = speechTag.trim() || 'Speech'
    const title = `${cleanSpeaker} ${cleanTag}`

    try {
      await addDoc(collection(db, 'resources'), {
        userId: user.uid,
        title,
        link: '',
        content: verbatim.trim(),
        kind: 'liveSpeech',
        createdAt: serverTimestamp(),
      })

      toast.success('Verbatim saved to Resource Library')
    } catch (saveError) {
      console.error('Save verbatim failed:', saveError)
      toast.error('Could not save verbatim. Try again.')
    }
  }, [speechTag, speakerCountry, user])

  const handleSavePoiToNotepad = useCallback(
    async (poi, index) => {
      if (!user) {
        toast.error('Please login again to save to Notepad.')
        return
      }

      try {
        const noteRef = doc(db, 'notes', user.uid)
        const noteSnap = await getDoc(noteRef)
        const currentContent = String(noteSnap.data()?.content || '')
        const nextContent = [
          currentContent.trim(),
          `POI ${index + 1} from ${speakerCountry || 'Delegate'}: ${poi}`,
        ]
          .filter(Boolean)
          .join('\n\n')

        await setDoc(noteRef, {
          userId: user.uid,
          content: nextContent,
          source: 'live-poi',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        toast.success('POI saved to Notepad')
      } catch (noteError) {
        console.error('Save POI failed:', noteError)
        toast.error('Could not save POI. Try again.')
      }
    },
    [speakerCountry, user],
  )

  const handleRecordSelectedPoi = useCallback(
    async (countryName) => {
      if (!selectedPoi) {
        toast.error('Select a POI first.')
        return
      }

      try {
        await recordPoiHistory(countryName, selectedPoi)
        toast.success(`Recorded POI for ${countryName}`)
      } catch (recordError) {
        console.error('Record POI history failed:', recordError)
        toast.error('Could not record POI. Try again.')
      }
    },
    [recordPoiHistory, selectedPoi],
  )

  const renderList = (items, toneClass, sectionKey) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
          No items yet.
        </p>
      ) : (
        items.map((item, index) => (
          <motion.div
            key={`${toneClass}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`rounded-xl border p-4 ${toneClass} ${selectedPoi === item ? 'ring-2 ring-blue-400/70' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (sectionKey === 'pois') {
                    setSelectedPoi(item)
                  }

                  setExpandedCards((prev) => ({
                    ...prev,
                    [sectionKey]: {
                      ...(prev[sectionKey] || {}),
                      [index]: !prev?.[sectionKey]?.[index],
                    },
                  }))
                }}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <div className="mt-0.5 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/80">
                  {expandedCards?.[sectionKey]?.[index] ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-white">
                    {expandedCards?.[sectionKey]?.[index] ? item : `${item.slice(0, 180)}${item.length > 180 ? '...' : ''}`}
                  </p>
                  {sectionKey === 'pois' && selectedPoi === item && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100">
                      <Star className="h-3 w-3" />
                      Selected POI
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(item)}
                className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/80 transition hover:bg-white/5"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {toneClass.includes('emerald') && (
                <button
                  type="button"
                  onClick={() => handleSavePoiToNotepad(item, index)}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-500/20"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save to Notepad
                </button>
              )}

              {sectionKey === 'pois' && (
                <button
                  type="button"
                  onClick={() => setSelectedPoi(item)}
                  className="inline-flex items-center gap-2 rounded-md border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-500/20"
                >
                  <Star className="h-3.5 w-3.5" />
                  Select POI
                </button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  )

  const selectedPoiIndex = useMemo(
    () => pois.findIndex((poi) => poi === selectedPoi),
    [pois, selectedPoi],
  )

  const handleJumpToSelectedPoi = useCallback((index) => {
    const poi = pois[index]
    if (!poi) {
      return
    }

    setSelectedPoi(poi)
    setExpandedCards((prev) => ({
      ...prev,
      pois: {
        ...(prev.pois || {}),
        [index]: true,
      },
    }))
  }, [pois])

  const trackerPanel = (
    <article className="saas-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Engagement Tracker</h3>
          <p className="text-sm text-zinc-300">Track who you have already asked POIs to.</p>
        </div>
        <span className="text-xs text-zinc-400">{countries.length} countries</span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={countryInput}
          onChange={(event) => setCountryInput(event.target.value)}
          placeholder="Add country"
          className="saas-input min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={async () => {
            await addCountry(countryInput)
            setCountryInput('')
          }}
          className="saas-btn-primary px-3 py-2"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {sessionLoading ? (
          <p className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            Loading tracker...
          </p>
        ) : countries.length === 0 ? (
          <p className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            Add countries to track POI engagement.
          </p>
        ) : (
          countries.map((country) => (
            <div key={country.name} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-100">
                  <input
                    type="checkbox"
                    checked={country.poiAsked}
                    onChange={() => togglePoiAsked(country.name)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-blue-500"
                  />
                  {country.name}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRecordSelectedPoi(country.name)}
                    disabled={!selectedPoi}
                    className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Log selected POI
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCountry(country.name)}
                    className="rounded-md border border-zinc-600 p-2 text-zinc-300 transition hover:border-rose-400 hover:text-rose-300"
                    aria-label={`Remove ${country.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-zinc-700 pt-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-400">
                  <span>POI History</span>
                  <span>{Array.isArray(country.poiHistory) ? country.poiHistory.length : 0} entries</span>
                </div>

                {Array.isArray(country.poiHistory) && country.poiHistory.length > 0 ? (
                  <div className="space-y-2">
                    {country.poiHistory.map((historyItem, historyIndex) => (
                      <div key={`${country.name}-history-${historyIndex}`} className="rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-xs text-zinc-300">
                        <p className="whitespace-pre-wrap">{historyItem.text}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">{formatHistoryTime(historyItem.recordedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No POIs logged yet.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  )

  return (
    <section className="space-y-4 text-white">
      <header className="saas-card">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-indigo-400">Live Session</p>
            <h2 className="text-2xl font-bold">War Room</h2>
            <p className="mt-1 text-sm text-zinc-400">Real-time debate intelligence for live MUN sessions.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">
            <p className="font-semibold text-white">Mission Brief</p>
            <p className="text-zinc-300">Agenda: {missionBrief.agenda || 'Not set'}</p>
            <p className="text-zinc-300">Portfolio: {missionBrief.portfolio || 'Not set'}</p>
          </div>
        </div>
      </header>

      {(error || (!missionBrief.agenda && !missionBrief.portfolio)) && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error || 'Complete your committee setup in Dashboard first.'}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="saas-card">
              <label className="mb-2 block text-sm font-semibold text-zinc-200">Speaker Country</label>
              <input
                value={speakerCountry}
                onChange={(event) => setSpeakerCountry(event.target.value)}
                placeholder="e.g. France"
                className="saas-input"
              />

              <label className="mb-2 mt-4 block text-sm font-semibold text-zinc-200">Speech Tag</label>
              <input
                value={speechTag}
                onChange={(event) => setSpeechTag(event.target.value)}
                placeholder="e.g. GSL, MOD-1 Speech"
                className="saas-input"
              />

              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                <span>Word count</span>
                <span>{wordCount} words</span>
              </div>
            </article>

            <article className="saas-card">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Verbatim</h3>
                <button
                  type="button"
                  onClick={handleSaveVerbatim}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-500/20"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Speech
                </button>
              </div>

              <textarea
                ref={verbatimRef}
                onInput={handleVerbatimInput}
                placeholder="Type delegate's speech here..."
                className="min-h-[280px] w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm leading-7 text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAnalyzeSpeech}
              disabled={loading}
              className="saas-btn-primary"
            >
              Analyze Speech
            </button>
            <button
              type="button"
              onClick={handleClearSession}
              className="saas-btn-secondary"
            >
              Clear Session
            </button>
          </div>

          <article className="saas-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-300">POIs</h3>
              <span className="text-xs text-zinc-400">Strategic traps</span>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Jump to selected POI</span>
              <div className="flex max-w-full flex-wrap gap-2">
                {pois.length === 0 ? (
                  <span className="text-xs text-zinc-500">No POIs yet</span>
                ) : (
                  pois.map((poi, index) => (
                    <button
                      key={`poi-nav-${index}`}
                      type="button"
                      onClick={() => handleJumpToSelectedPoi(index)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selectedPoi === poi
                          ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-100'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      #{index + 1}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="mb-3 flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300">
              <span>
                Selected POI: {selectedPoi ? `Ready${selectedPoiIndex >= 0 ? ` (#${selectedPoiIndex + 1})` : ''}` : 'None selected'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedPoi) {
                    toast.error('Select a POI first.')
                    return
                  }

                  await handleSavePoiToNotepad(selectedPoi, pois.findIndex((poi) => poi === selectedPoi) >= 0 ? pois.findIndex((poi) => poi === selectedPoi) : 0)
                }}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
              >
                <Save className="h-3.5 w-3.5" />
                Save Selected POI
              </button>
            </div>
            {renderList(pois, 'border-emerald-500/30 bg-emerald-500/10', 'pois')}
          </article>

          <article className="saas-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-300">POOs</h3>
              <span className="text-xs text-zinc-400">Warnings and issues</span>
            </div>
            {renderList(poos, 'border-red-500/35 bg-red-500/10', 'poos')}
          </article>
        </div>

        <aside className="space-y-4">
          <div className="hidden xl:block">{trackerPanel}</div>

          <article className="saas-card xl:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Engagement Tracker</h3>
                <p className="text-sm text-zinc-300">Track and log countries during the session.</p>
              </div>
              <button
                type="button"
                onClick={() => setTrackerOpen((prev) => !prev)}
                className="saas-btn-secondary px-3 py-2 text-xs"
              >
                <Menu className="h-4 w-4" />
                {trackerOpen ? 'Close' : 'Open'}
              </button>
            </div>

            {trackerOpen ? trackerPanel : (
              <p className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                Open the tracker to manage countries and POI history on mobile.
              </p>
            )}
          </article>

          <article className="saas-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm text-zinc-400">Session tools and status shortcuts.</p>
              </div>
              <span className="text-xs text-zinc-400">{pois.length} POIs / {poos.length} POOs</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClearSession}
                className="saas-btn-secondary"
              >
                Clear Session
              </button>

              <button
                type="button"
                onClick={() => {
                  if (verbatimRef.current) {
                    verbatimRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-100 transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-500/20"
              >
                Jump to Verbatim
              </button>
            </div>
          </article>

          {loading && (
            <div className="overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-100">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-semibold">Processing Speech...</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-950/40">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-400" />
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
