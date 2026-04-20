import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { db } from '../services/firebase'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Notepad() {
  const { user } = useAuth()
  const textareaRef = useRef(null)
  const loadedContentRef = useRef('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState('')

  const debouncedContent = useDebounce(content, 800)

  useEffect(() => {
    if (!user) {
      setContent('')
      setLoading(false)
      return () => {}
    }

    setLoading(true)
    const noteRef = doc(db, 'notes', user.uid)

    const unsubscribe = onSnapshot(
      noteRef,
      (snapshot) => {
        const data = snapshot.data()
        const nextContent = String(data?.content || '')

        loadedContentRef.current = nextContent
        setContent(nextContent)
        setSavedAt(data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt || null)
        setHasLoaded(true)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Failed to load note:', snapshotError)
        setError('Unable to load your note right now.')
        setLoading(false)
        setHasLoaded(true)
      },
    )

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!hasLoaded || !user) {
      return
    }

    const noteRef = doc(db, 'notes', user.uid)

    const saveNote = async () => {
      setSaving(true)
      try {
        if (debouncedContent === loadedContentRef.current) {
          setSaving(false)
          return
        }

        await setDoc(
          noteRef,
          {
            userId: user.uid,
            content: debouncedContent,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        setError('')
        loadedContentRef.current = debouncedContent
        setSavedAt(new Date())
      } catch (saveError) {
        console.error('Auto-save failed:', saveError)
        setError('Auto-save failed. Retrying is recommended.')
      } finally {
        setSaving(false)
      }
    }

    if (debouncedContent.trim() || debouncedContent === '') {
      saveNote()
    }
  }, [debouncedContent, hasLoaded, user])

  const handleChange = useCallback((event) => {
    setContent(event.target.value)
  }, [])

  const saveMeta = savedAt
    ? `Saved ${savedAt instanceof Date ? savedAt.toLocaleString() : 'recently'}`
    : 'Auto-saving enabled'

  return (
    <section className="saas-card overflow-hidden p-0 text-white">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-400">Workspace</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Strategy Notepad</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Distraction-free workspace for strategy notes, speech drafts, and quick ideas.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : saveMeta}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div className="p-5 md:p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-900" />
              <div className="h-[430px] animate-pulse rounded-2xl bg-zinc-900" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              placeholder="Write your strategy notes, speech drafts, negotiation cues, or quick ideas here..."
              className="min-h-[560px] w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-[17px] leading-8 text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30"
              style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
            />
          )}
        </div>

        <aside className="border-t border-zinc-800 bg-zinc-950/80 p-5 lg:border-l lg:border-t-0">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Workspace Tips</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
              <li>• Type freely. Notes save automatically after a short pause.</li>
              <li>• Use this for speeches, clauses, rebuttals, and prep ideas.</li>
              <li>• Keep it open during debate for fast thinking.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Status</h3>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>Autosave: Enabled</p>
              <p>Last saved: {savedAt ? (savedAt instanceof Date ? savedAt.toLocaleTimeString() : 'recently') : 'Waiting for first save'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                textareaRef.current.focus()
              }
              toast.success('Ready to write')
            }}
            className="saas-btn-primary mt-4 w-full"
          >
            Focus Editor
          </button>
        </aside>
      </div>
    </section>
  )
}
