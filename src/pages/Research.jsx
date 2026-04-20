import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import ResourceCard from '../components/ui/ResourceCard'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useAuth } from '../hooks/useAuth'
import { useCommittee } from '../hooks/useCommittee'
import { db } from '../services/firebase'
import { callAI } from '../services/ai'

const GENERATOR_PROMPTS = {
  openingSpeech: ({ agenda, portfolio }) =>
    `Generate a strong MUN opening speech for ${portfolio} on ${agenda}.`,
  pois: ({ agenda, portfolio }) =>
    `Generate 8 sharp POIs that ${portfolio} can ask delegates from other nations on the agenda: ${agenda}. Do not generate POIs targeting ${portfolio}.`,
  positionIdeas: ({ agenda, portfolio }) =>
    `Give key arguments and stance for ${portfolio} on ${agenda}.`,
}

const GENERATOR_LABELS = {
  openingSpeech: 'Opening Speech',
  pois: 'POIs To Ask Other Nations',
  positionIdeas: 'Position Ideas',
}

function normalizeErrorMessage(error) {
  if (error?.code === 'AI_RATE_LIMIT') {
    return 'AI is busy right now. Please retry in a few moments.'
  }

  if (error?.code === 'AI_INVALID_KEY' || error?.code === 'AI_CONFIG_MISSING_KEY') {
    return 'AI service configuration is invalid. Please verify API key setup.'
  }

  if (error?.code === 'AI_MODEL_NOT_FOUND') {
    return 'Configured AI model is unavailable. Please use a supported Groq model.'
  }

  return error?.message || 'AI service temporarily unavailable.'
}

function isValidHttpUrl(value) {
  try {
    const parsedUrl = new URL(value)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export default function Research() {
  const { user } = useAuth()
  const { agenda, portfolio } = useCommittee()

  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [generatedOutputs, setGeneratedOutputs] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [resources, setResources] = useState([])
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceLink, setResourceLink] = useState('')
  const [resourceLoading, setResourceLoading] = useState(true)
  const [resourceError, setResourceError] = useState('')

  const chatScrollRef = useRef(null)

  const contextReady = useMemo(
    () => Boolean(agenda?.trim() && portfolio?.trim()),
    [agenda, portfolio],
  )

  const scrollChatToBottom = useCallback(() => {
    if (!chatScrollRef.current) {
      return
    }

    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [])

  useEffect(() => {
    scrollChatToBottom()
  }, [chatMessages, loading, scrollChatToBottom])

  useEffect(() => {
    if (!user) {
      setResources([])
      setResourceLoading(false)
      return () => {}
    }

    setResourceLoading(true)
    setResourceError('')

    const resourcesQuery = query(collection(db, 'resources'), where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(
      resourcesQuery,
      (snapshot) => {
        const nextResources = snapshot.docs
          .map((resourceDoc) => ({
            id: resourceDoc.id,
            ...resourceDoc.data(),
          }))
          .sort((a, b) => {
            const aSeconds = a.createdAt?.seconds || 0
            const bSeconds = b.createdAt?.seconds || 0
            return bSeconds - aSeconds
          })

        setResources(nextResources)
        setResourceLoading(false)
      },
      (firebaseError) => {
        console.error('Resource snapshot error:', firebaseError)
        setResourceError('Unable to load resources right now.')
        setResourceLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const runAI = useCallback(
    async ({ userQuery, mode }) => {
      if (!contextReady) {
        const contextError = 'Please save committee portfolio and agenda from Dashboard before using AI tools.'
        setError(contextError)
        toast.error(contextError)
        return null
      }

      setError('')
      setLoading(true)

      try {
        const responseText = await callAI({
          agenda,
          portfolio,
          userQuery,
          mode,
        })

        return responseText
      } catch (aiError) {
        const message = normalizeErrorMessage(aiError)
        setError(message)
        toast.error(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [agenda, portfolio, contextReady],
  )

  const handleChatSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const nextQuery = inputText.trim()
      if (!nextQuery) {
        setError('Please enter a question for the strategist.')
        return
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: nextQuery,
      }

      setChatMessages((prevMessages) => [...prevMessages, userMessage])
      setInputText('')

      const responseText = await runAI({
        userQuery: nextQuery,
        mode: 'chat',
      })

      if (!responseText) {
        return
      }

      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: responseText,
        },
      ])
    },
    [inputText, runAI],
  )

  const handleGeneratorClick = useCallback(
    async (generatorKey) => {
      const generatorFn = GENERATOR_PROMPTS[generatorKey]
      if (!generatorFn) {
        return
      }

      const prompt = generatorFn({ agenda, portfolio })
      const responseText = await runAI({
        userQuery: prompt,
        mode: 'generator',
      })

      if (!responseText) {
        return
      }

      setGeneratedOutputs((prevOutputs) => ({
        ...prevOutputs,
        [generatorKey]: responseText,
      }))
    },
    [agenda, portfolio, runAI],
  )

  const handleSaveGeneratedOutput = useCallback(async (generatorKey) => {
    if (!user) {
      setResourceError('Please login again to save resources.')
      return
    }

    const generatedOutput = generatedOutputs[generatorKey]
    if (!generatedOutput) {
      setResourceError('Generate an output first before saving.')
      return
    }

    setResourceError('')

    const outputLabel = GENERATOR_LABELS[generatorKey] || 'Generated Output'
    const outputTitle = `${outputLabel} - ${portfolio} - ${agenda}`

    try {
      await addDoc(collection(db, 'resources'), {
        userId: user.uid,
        title: outputTitle,
        link: '',
        content: generatedOutput,
        kind: generatorKey,
        createdAt: serverTimestamp(),
      })

      toast.success('Generated output saved to Resource Library')
    } catch (firebaseError) {
      console.error('Save generated output failed:', firebaseError)
      setResourceError('Could not save generated output. Try again.')
    }
  }, [user, generatedOutputs, portfolio, agenda])

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

  const handleAddResource = useCallback(
    async (event) => {
      event.preventDefault()

      const cleanTitle = resourceTitle.trim()
      const cleanLink = resourceLink.trim()

      if (!cleanTitle || !cleanLink) {
        setResourceError('Please provide both title and link.')
        return
      }

      if (!isValidHttpUrl(cleanLink)) {
        setResourceError('Please enter a valid URL starting with http:// or https://')
        return
      }

      if (!user) {
        setResourceError('Please login again to save resources.')
        return
      }

      setResourceError('')

      try {
        await addDoc(collection(db, 'resources'), {
          userId: user.uid,
          title: cleanTitle,
          link: cleanLink,
          createdAt: serverTimestamp(),
        })

        setResourceTitle('')
        setResourceLink('')
        toast.success('Resource saved')
      } catch (firebaseError) {
        console.error('Add resource failed:', firebaseError)
        setResourceError('Could not save resource. Try again.')
      }
    },
    [resourceTitle, resourceLink, user],
  )

  const handleDeleteResource = useCallback(async (resourceId) => {
    try {
      await deleteDoc(doc(db, 'resources', resourceId))
      toast.success('Resource deleted')
    } catch (firebaseError) {
      console.error('Delete resource failed:', firebaseError)
      setResourceError('Could not delete resource. Try again.')
    }
  }, [])

  return (
    <section className="space-y-4 text-white">
      <header className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <h2 className="text-2xl font-bold">Research &amp; AI Intelligence Hub</h2>
        <p className="mt-1 text-sm text-slate-300">
          Ask strategic questions, generate tactical content, and maintain a personal resource library.
        </p>
      </header>

      {!contextReady && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Complete your committee setup in Dashboard first. AI tools use your agenda and portfolio context.
        </div>
      )}

      {(error || resourceError) && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error || resourceError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[7fr_3fr]">
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Strategist Chat</h3>
              <span className="text-xs text-slate-400">Contextual to your portfolio</span>
            </div>

            <div
              ref={chatScrollRef}
              className="mb-4 h-[320px] space-y-3 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/60 p-3"
            >
              {chatMessages.length === 0 && !loading && (
                <p className="text-sm text-slate-400">
                  Start by asking for negotiation strategy, rebuttals, or bloc-building advice.
                </p>
              )}

              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={[
                    'rounded-xl p-3 text-sm',
                    message.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-blue-600 text-white'
                      : 'max-w-[90%] border border-slate-700 bg-slate-800 text-slate-100',
                  ].join(' ')}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      className="mt-2 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      Copy
                    </button>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="max-w-[90%] rounded-xl border border-slate-700 bg-slate-800 p-3">
                  <p className="mb-2 text-xs text-slate-400">Thinking...</p>
                  <SkeletonLoader lines={4} />
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Ask for strategy, rebuttals, or speech support..."
                className="min-h-11 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
              >
                Send
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm md:p-5">
            <h3 className="text-lg font-semibold">AI Generator Suite</h3>
            <p className="mt-1 text-sm text-slate-300">
              Generate ready-to-use outputs for speeches, POIs, and strategic positioning.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleGeneratorClick('openingSpeech')}
                disabled={loading}
                className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate Opening Speech
              </button>

              <button
                type="button"
                onClick={() => handleGeneratorClick('pois')}
                disabled={loading}
                className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate POIs
              </button>

              <button
                type="button"
                onClick={() => handleGeneratorClick('positionIdeas')}
                disabled={loading}
                className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate Position Ideas
              </button>
            </div>

            {loading && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <SkeletonLoader lines={5} />
              </div>
            )}

            {Object.entries(generatedOutputs).length > 0 && (
              <div className="mt-4 space-y-3">
                {Object.entries(generatedOutputs).map(([generatorKey, generatedOutput]) => (
                  <motion.article
                    key={generatorKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {GENERATOR_LABELS[generatorKey] || 'Generated Output'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveGeneratedOutput(generatorKey)}
                          className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
                        >
                          Save To Library
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedOutput)}
                          className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-100">{generatedOutput}</p>
                  </motion.article>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-semibold">Resource Library</h3>
          <p className="mt-1 text-sm text-slate-300">Save trusted references for quick access during debate prep.</p>

          <form onSubmit={handleAddResource} className="mt-4 space-y-3">
            <input
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
              placeholder="Resource title"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400"
            />

            <input
              value={resourceLink}
              onChange={(event) => setResourceLink(event.target.value)}
              placeholder="https://example.org"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400"
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Add Resource
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {resourceLoading && <SkeletonLoader lines={4} />}

            {!resourceLoading && resources.length === 0 && (
              <p className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-400">
                No resources saved yet.
              </p>
            )}

            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                title={resource.title}
                link={resource.link}
                content={resource.content}
                kind={resource.kind}
                onCopy={resource.content ? () => handleCopy(resource.content) : undefined}
                onDelete={() => handleDeleteResource(resource.id)}
              />
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
