import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { suggestCities } from '../functions'
import { type CitySuggestion, locationLookup } from '../rules'

const DEBOUNCE_MS = 250

/** Debounced commune suggestions for a city name or a postal code. */
export function useCitySuggestions(query: string): {
  cities: CitySuggestion[]
  loading: boolean
} {
  const fetchCities = useServerFn(suggestCities)
  const [cities, setCities] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const lookup = locationLookup(query)?.value ?? null

  useEffect(() => {
    if (!lookup) {
      setCities([])
      setLoading(false)
      return
    }
    let current = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const result = await fetchCities({ data: { q: lookup } })
        if (current) setCities(result)
      } catch {
        if (current) setCities([])
      } finally {
        if (current) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [lookup, fetchCities])

  return { cities, loading }
}
