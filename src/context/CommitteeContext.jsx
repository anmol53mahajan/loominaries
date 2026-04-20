import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../services/firebase'

const CommitteeContext = createContext(undefined)

const initialCommitteeState = {
  committeeName: '',
  portfolio: '',
  agenda: '',
}

function hasCommitteeFields(data) {
  return Boolean(data.committeeName && data.portfolio && data.agenda)
}

export function CommitteeProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [committeeName, setCommitteeName] = useState(initialCommitteeState.committeeName)
  const [portfolio, setPortfolio] = useState(initialCommitteeState.portfolio)
  const [agenda, setAgenda] = useState(initialCommitteeState.agenda)
  const [loading, setLoading] = useState(true)

  const setCommitteeData = useCallback((data) => {
    setCommitteeName(data.committeeName || '')
    setPortfolio(data.portfolio || '')
    setAgenda(data.agenda || '')
  }, [])

  const loadCommitteeData = useCallback(async () => {
    if (!user) {
      setCommitteeData(initialCommitteeState)
      return null
    }

    const committeeRef = doc(db, 'committees', user.uid)
    const committeeSnap = await getDoc(committeeRef)

    if (!committeeSnap.exists()) {
      setCommitteeData(initialCommitteeState)
      return null
    }

    const data = committeeSnap.data()
    const safeData = {
      committeeName: data.committeeName || '',
      portfolio: data.portfolio || '',
      agenda: data.agenda || '',
    }

    setCommitteeData(safeData)
    return safeData
  }, [user, setCommitteeData])

  const saveCommitteeData = useCallback(
    async (data) => {
      if (!user) {
        throw new Error('User must be logged in to save committee data.')
      }

      const payload = {
        userId: user.uid,
        committeeName: data.committeeName,
        portfolio: data.portfolio,
        agenda: data.agenda,
      }

      await setDoc(doc(db, 'committees', user.uid), payload, { merge: true })
      setCommitteeData(payload)
      return payload
    },
    [user, setCommitteeData],
  )

  const deleteCommitteeData = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to delete committee data.')
    }

    await deleteDoc(doc(db, 'committees', user.uid))
    setCommitteeData(initialCommitteeState)
    return null
  }, [user, setCommitteeData])

  useEffect(() => {
    let isMounted = true

    async function syncCommitteeData() {
      if (authLoading) {
        return
      }

      if (!user) {
        if (isMounted) {
          setCommitteeData(initialCommitteeState)
          setLoading(false)
        }
        return
      }

      if (isMounted) {
        setLoading(true)
      }

      try {
        await loadCommitteeData()
      } catch (error) {
        console.error('Failed to load committee data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    syncCommitteeData()

    return () => {
      isMounted = false
    }
  }, [authLoading, user, loadCommitteeData, setCommitteeData])

  const hasCommitteeData = hasCommitteeFields({
    committeeName,
    portfolio,
    agenda,
  })

  const value = useMemo(
    () => ({
      committeeName,
      portfolio,
      agenda,
      loading,
      hasCommitteeData,
      setCommitteeData,
      loadCommitteeData,
      saveCommitteeData,
      deleteCommitteeData,
    }),
    [
      committeeName,
      portfolio,
      agenda,
      loading,
      hasCommitteeData,
      setCommitteeData,
      loadCommitteeData,
      saveCommitteeData,
      deleteCommitteeData,
    ],
  )

  return <CommitteeContext.Provider value={value}>{children}</CommitteeContext.Provider>
}

export function useCommitteeContext() {
  const context = useContext(CommitteeContext)

  if (!context) {
    throw new Error('useCommitteeContext must be used inside a CommitteeProvider')
  }

  return context
}
