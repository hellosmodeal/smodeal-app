import {
  type CitySuggestion,
  citySuggestionsFromCommunes,
  communeCenter,
  type GeoPoint,
  locationLookup,
  MAX_CITY_SUGGESTIONS,
  roundCoordinate,
} from './rules'

const COMMUNES_URL = 'https://geo.api.gouv.fr/communes'
const COMMUNE_FIELDS = 'nom,codesPostaux,codeDepartement,centre'
const TIMEOUT_MS = 2500
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>

/** French communes from geo.api.gouv.fr, with an in-memory cache of successful answers. */
export function createGeoApi({
  fetcher = fetch,
  now = Date.now,
}: {
  fetcher?: Fetcher
  now?: () => number
} = {}) {
  const cache = new Map<string, { at: number; value: unknown }>()

  async function communes(
    key: string,
    params: Record<string, string>,
  ): Promise<unknown> {
    const cached = cache.get(key)
    if (cached && now() - cached.at < CACHE_TTL_MS) return cached.value

    const url = new URL(COMMUNES_URL)
    for (const [name, value] of Object.entries(params))
      url.searchParams.set(name, value)
    url.searchParams.set('fields', COMMUNE_FIELDS)

    try {
      const response = await fetcher(url.toString(), {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) return null
      const value: unknown = await response.json()
      if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
      cache.set(key, { at: now(), value })
      return value
    } catch {
      return null
    }
  }

  return {
    async searchCommunes(query: string): Promise<CitySuggestion[]> {
      const lookup = locationLookup(query)
      if (!lookup) return []
      const params: Record<string, string> =
        lookup.kind === 'postalCode'
          ? { codePostal: lookup.value }
          : { nom: lookup.value, boost: 'population' }
      params.limit = String(MAX_CITY_SUGGESTIONS)
      return citySuggestionsFromCommunes(
        await communes(
          `search:${lookup.kind}:${lookup.value.toLowerCase()}`,
          params,
        ),
      )
    },

    async locateCity(place: {
      city: string
      postalCode: string
    }): Promise<GeoPoint | null> {
      const city = place.city.trim()
      return communeCenter(
        await communes(`city:${place.postalCode}:${city.toLowerCase()}`, {
          nom: city,
          codePostal: place.postalCode,
        }),
        { city, postalCode: place.postalCode },
      )
    },

    async communeAt(point: GeoPoint): Promise<CitySuggestion | null> {
      const lat = String(roundCoordinate(point.lat))
      const lon = String(roundCoordinate(point.lng))
      const [commune] = citySuggestionsFromCommunes(
        await communes(`at:${lat}:${lon}`, { lat, lon }),
      )
      return commune ?? null
    },
  }
}

export const geoApi = createGeoApi()
