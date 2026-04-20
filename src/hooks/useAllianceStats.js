import { useMemo } from 'react'

export function useAllianceStats(countries) {
  return useMemo(() => {
    const totalCountries = countries.length
    const alliesCount = countries.filter((country) => country.sentiment === 'ally').length
    const opponentsCount = countries.filter((country) => country.sentiment === 'opponent').length
    const neutralCount = countries.filter((country) => country.sentiment === 'neutral').length
    const majority = Math.floor(totalCountries / 2) + 1

    return {
      totalCountries,
      alliesCount,
      opponentsCount,
      neutralCount,
      majority,
    }
  }, [countries])
}
