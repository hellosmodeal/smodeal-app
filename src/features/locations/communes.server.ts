import {
  type CitySuggestion,
  citySuggestionsFromCommunes,
  locationLookup,
  MAX_CITY_SUGGESTIONS,
} from './rules'

const COMMUNES_URL = 'https://geo.api.gouv.fr/communes'
const TIMEOUT_MS = 2500
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>

/** French communes matching a name or postal code, cached in memory. */
export function createCommuneSearch({
  fetcher = fetch,
  now = Date.now,
}: {
  fetcher?: Fetcher
  now?: () => number
} = {}) {
  const cache = new Map<string, { at: number; value: CitySuggestion[] }>()

  return async function searchCommunes(
    query: string,
  ): Promise<CitySuggestion[]> {
    const lookup = locationLookup(query)
    if (!lookup) return []
    const key = `${lookup.kind}:${lookup.value.toLowerCase()}`
    const cached = cache.get(key)
    if (cached && now() - cached.at < CACHE_TTL_MS) return cached.value

    const url = new URL(COMMUNES_URL)
    url.searchParams.set(
      lookup.kind === 'postalCode' ? 'codePostal' : 'nom',
      lookup.value,
    )
    url.searchParams.set('fields', 'nom,codesPostaux,codeDepartement')
    if (lookup.kind === 'name') url.searchParams.set('boost', 'population')
    url.searchParams.set('limit', String(MAX_CITY_SUGGESTIONS))

    try {
      const response = await fetcher(url.toString(), {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) return []
      const value = citySuggestionsFromCommunes(await response.json())
      if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
      cache.set(key, { at: now(), value })
      return value
    } catch {
      return []
    }
  }
}

export const searchCommunes = createCommuneSearch()
