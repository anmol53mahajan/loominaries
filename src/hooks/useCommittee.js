import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useCommitteeContext } from '../context/CommitteeContext'
import { useAuth } from './useAuth'
import { db } from '../services/firebase'

export function useCommittee() {
  const committeeContext = useCommitteeContext()
  const { user } = useAuth()
  const [countries, setCountries] = useState([])
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCountries([])
      setSessionLoading(false)
      return () => {}
    }

    setSessionLoading(true)

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
      },
      (error) => {
        console.error('Failed to load sessions:', error)
        setCountries([])
        setSessionLoading(false)
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

      const nextCountries = [...countries, { name: cleanCountryName, poiAsked: false }]
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
          { text: cleanPoiText, recordedAt: new Date().toISOString() },
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
    addCountry,
    togglePoiAsked,
    removeCountry,
    recordPoiHistory,
  }
}
