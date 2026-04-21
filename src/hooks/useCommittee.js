import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useCommitteeContext } from '../context/CommitteeContext'
import { useAuth } from './useAuth'
import { db } from '../services/firebase'

export function useCommittee() {
  const committeeContext = useCommitteeContext()
  const { user } = useAuth()
  const [countries, setCountries] = useState([])
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!user) {
      setCountries([])
      setSessionLoading(false)
      setSessionError('')
      return () => {}
    }

    setSessionLoading(true)
    setSessionError('')

    const sessionRef = doc(db, 'sessions', user.uid)
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        const data = snapshot.data()
        const nextCountries = Array.isArray(data?.countries)
          ? data.countries
              .map((country) => ({
                name: String(country?.name || '').trim(),
                poiAsked: Boolean(country?.poiAsked),
                sentiment: ['ally', 'neutral', 'opponent'].includes(String(country?.sentiment || '').toLowerCase())
                  ? String(country.sentiment).toLowerCase()
                  : 'neutral',
                vote: ['yes', 'no', 'abstain'].includes(String(country?.vote || '').toLowerCase())
                  ? String(country.vote).toLowerCase()
                  : 'abstain',
                poiHistory: Array.isArray(country?.poiHistory)
                  ? country.poiHistory
                      .map((entry) => {
                        if (typeof entry === 'string') {
                          const cleanText = entry.trim()
                          return cleanText ? { text: cleanText, recordedAt: null } : null
                        }

                        const cleanText = String(entry?.text || entry?.content || '').trim()
                        if (!cleanText) {
                          return null
                        }

                        return {
                          text: cleanText,
                          recordedAt: entry?.recordedAt || entry?.timestamp || null,
                        }
                      })
                      .filter(Boolean)
                  : [],
              }))
              .filter((country) => country.name)
          : []

        setCountries(nextCountries)
        setSessionLoading(false)
        setSessionError('')
      },
      (error) => {
        console.error('Failed to load sessions:', error)
        setCountries([])
        setSessionLoading(false)
        setSessionError('Unable to load alliance tracker right now.')
      },
    )

    return unsubscribe
  }, [user])

  const persistCountries = useCallback(
    async (nextCountries) => {
      if (!user) {
        throw new Error('User must be logged in to update session tracking.')
      }

      await setDoc(
        doc(db, 'sessions', user.uid),
        {
          userId: user.uid,
          countries: nextCountries,
        },
        { merge: true },
      )
    },
    [user],
  )

  const addCountry = useCallback(
    async (countryName) => {
      const cleanCountryName = countryName.trim()
      if (!cleanCountryName) {
        return
      }

      const exists = countries.some(
        (country) => country.name.toLowerCase() === cleanCountryName.toLowerCase(),
      )

      if (exists) {
        return
      }

      const nextCountries = [...countries, {
        name: cleanCountryName,
        poiAsked: false,
        sentiment: 'neutral',
        vote: 'abstain',
        poiHistory: [],
      }]
      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  const updateCountrySentiment = useCallback(
    async (countryName, sentiment) => {
      const cleanSentiment = String(sentiment || '').toLowerCase()
      if (!['ally', 'neutral', 'opponent'].includes(cleanSentiment)) {
        return
      }

      const nextCountries = countries.map((country) =>
        country.name === countryName ? { ...country, sentiment: cleanSentiment } : country,
      )

      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  const updateCountryVote = useCallback(
    async (countryName, vote) => {
      const cleanVote = String(vote || '').toLowerCase()
      if (!['yes', 'no', 'abstain'].includes(cleanVote)) {
        return
      }

      const nextCountries = countries.map((country) =>
        country.name === countryName ? { ...country, vote: cleanVote } : country,
      )

      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  const togglePoiAsked = useCallback(
    async (countryName) => {
      const nextCountries = countries.map((country) =>
        country.name === countryName ? { ...country, poiAsked: !country.poiAsked } : country,
      )

      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  const recordPoiHistory = useCallback(
    async (countryName, poiText) => {
      const cleanPoiText = String(poiText || '').trim()
      if (!cleanPoiText) {
        return
      }

      const nextCountries = countries.map((country) => {
        if (country.name !== countryName) {
          return country
        }

        const existingHistory = Array.isArray(country.poiHistory) ? country.poiHistory : []
        const nextHistory = [
          { text: cleanPoiText, recordedAt: serverTimestamp() },
          ...existingHistory,
        ].slice(0, 12)

        return {
          ...country,
          poiAsked: true,
          poiHistory: nextHistory,
        }
      })

      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  const removeCountry = useCallback(
    async (countryName) => {
      const nextCountries = countries.filter((country) => country.name !== countryName)
      setCountries(nextCountries)
      await persistCountries(nextCountries)
    },
    [countries, persistCountries],
  )

  return {
    ...committeeContext,
    countries,
    sessionLoading,
    sessionError,
    addCountry,
    togglePoiAsked,
    removeCountry,
    updateCountrySentiment,
    updateCountryVote,
    recordPoiHistory,
  }
}
