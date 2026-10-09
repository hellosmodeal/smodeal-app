import { z } from 'zod'
import { frenchDepartments } from '@/features/search/departments'

export const MAX_CITY_SUGGESTIONS = 8
const MAX_DEPARTMENT_SUGGESTIONS = 3

export type LocationLookup = { kind: 'postalCode' | 'name'; value: string }

export type CitySuggestion = {
  city: string
  postalCodes: string[]
  department: string
}

export type DepartmentSuggestion = { code: string; name: string }

/** What to ask the communes API for, or `null` when the query is too vague. */
export function locationLookup(query: string): LocationLookup | null {
  const value = query.trim()
  if (/^\d{5}$/.test(value)) return { kind: 'postalCode', value }
  if (/\d/.test(value) || value.length < 2) return null
  return { kind: 'name', value }
}

const communeSchema = z.object({
  nom: z.string().min(1),
  codesPostaux: z.array(z.string().regex(/^\d{5}$/)).min(1),
  codeDepartement: z.string().min(2),
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
