import { z } from 'zod'
import { frenchDepartments } from '@/features/search/departments'

export const MAX_CITY_SUGGESTIONS = 8
const MAX_DEPARTMENT_SUGGESTIONS = 3

export type LocationLookup = { kind: 'postalCode' | 'name'; value: string }

export type GeoPoint = { lat: number; lng: number }

export type CitySuggestion = {
  city: string
  postalCodes: string[]
  department: string
  center?: GeoPoint
}

export type DepartmentSuggestion = { code: string; name: string }

/** What to ask the communes API for, or `null` when the query is too vague. */
export function locationLookup(query: string): LocationLookup | null {
  const value = query.trim()
  if (/^\d{5}$/.test(value)) return { kind: 'postalCode', value }
  if (/\d/.test(value) || value.length < 2) return null
  return { kind: 'name', value }
}

const centreSchema = z
  .object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  })
  .transform(({ coordinates: [lng, lat] }): GeoPoint => ({ lat, lng }))

const communeSchema = z.object({
  nom: z.string().min(1),
  codesPostaux: z.array(z.string().regex(/^\d{5}$/)).min(1),
  codeDepartement: z.string().min(2),
  centre: centreSchema.optional().catch(undefined),
})

/** Validated suggestions from the geo.api.gouv.fr `/communes` payload. */
export function citySuggestionsFromCommunes(
  payload: unknown,
): CitySuggestion[] {
  if (!Array.isArray(payload)) return []
  const suggestions: CitySuggestion[] = []
  for (const item of payload) {
    const commune = communeSchema.safeParse(item)
    if (!commune.success) continue
    suggestions.push({
      city: commune.data.nom,
      postalCodes: commune.data.codesPostaux,
      department: commune.data.codeDepartement,
      center: commune.data.centre,
    })
    if (suggestions.length === MAX_CITY_SUGGESTIONS) break
  }
  return suggestions
}

/** Postal code to keep once a city is chosen; empty when it must be picked. */
export function postalCodeAfterCityChoice(
  current: string,
  choice: CitySuggestion,
): string {
  if (choice.postalCodes.includes(current)) return current
  return choice.postalCodes.length === 1 ? (choice.postalCodes[0] ?? '') : ''
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Departments whose name or code matches the query, best matches first. */
export function departmentSuggestions(query: string): DepartmentSuggestion[] {
  const needle = normalize(query)
  if (needle.length < 2) return []
  const rank = ({ code, name }: DepartmentSuggestion) => {
    const label = normalize(name)
    if (code.toLowerCase().startsWith(needle) || label.startsWith(needle))
      return 0
    return label.includes(needle) ? 1 : null
  }
  return frenchDepartments
    .map((department) => ({ department, rank: rank(department) }))
    .filter(
      (match): match is { department: DepartmentSuggestion; rank: number } =>
        match.rank !== null,
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_DEPARTMENT_SUGGESTIONS)
    .map(({ department }) => department)
}

/** Centre of the commune matching both the city name and the postal code. */
export function communeCenter(
  payload: unknown,
  place: { city: string; postalCode: string },
): GeoPoint | null {
  if (!Array.isArray(payload)) return null
  const city = normalize(place.city)
  for (const item of payload) {
    const commune = communeSchema.safeParse(item)
    if (
      commune.success &&
      commune.data.centre &&
      normalize(commune.data.nom) === city &&
      commune.data.codesPostaux.includes(place.postalCode)
    )
      return commune.data.centre
  }
  return null
}

/** About one kilometre: enough to search nearby without exposing a position. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

const EARTH_RADIUS_KM = 6371

const radians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance between two points, in kilometres. */
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = radians(to.lat - from.lat)
  const dLng = radians(to.lng - from.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}
