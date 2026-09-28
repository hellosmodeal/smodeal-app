import { z } from 'zod'
import { previewCategories } from '@/features/listings/home-preview'

export const searchCategories = previewCategories

type CategorySlug = (typeof searchCategories)[number]['slug']

const categorySlugs = searchCategories.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[],
]

export const sortOptions = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'prix-croissant', label: 'Prix croissant' },
  { value: 'prix-decroissant', label: 'Prix décroissant' },
] as const

type SortValue = (typeof sortOptions)[number]['value']

const sortValues = sortOptions.map((option) => option.value) as [
  SortValue,
  ...SortValue[],
]

const RESULTS_PER_PAGE = 12

export type SearchListing = {
  id: string
  title: string
  category: CategorySlug
  priceCents: number
  city: string
  postalCode: string
  departmentCode: string
  departmentName: string
  publishedAt: string
  image?: string
}

function toOptionalText(value: unknown): string | undefined {
  const text =
    typeof value === 'number' ? String(value) : (value as string | undefined)
  if (typeof text !== 'string') return undefined
  const trimmed = text.trim().slice(0, 100)
  return trimmed || undefined
}

const optionalText = z.preprocess(toOptionalText, z.string().optional())

const optionalEuros = z
  .preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().min(0).max(10_000_000).optional(),
  )
  .catch(undefined)

const searchCriteriaSchema = z.object({
  q: optionalText,
  lieu: optionalText,
  categorie: z.enum(categorySlugs).optional().catch(undefined),
  departement: z
    .preprocess(
      (value) => toOptionalText(value)?.toUpperCase(),
      z
        .string()
        .regex(/^(\d{2,3}|2[AB])$/)
        .optional(),
    )
    .catch(undefined),
  prixMin: optionalEuros,
  prixMax: optionalEuros,
  tri: z.enum(sortValues).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type SearchCriteria = z.infer<typeof searchCriteriaSchema>

export function parseSearchCriteria(
  search: Record<string, unknown>,
): SearchCriteria {
  const parsed = searchCriteriaSchema.parse(search)
  return Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  ) as SearchCriteria
}

export function requiresLongerKeyword(criteria: SearchCriteria): boolean {
  return Boolean(criteria.q && criteria.q.length < 3)
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-’']/g, ' ')
    .toLocaleLowerCase('fr')
    .trim()
}

function matchesPlace(listing: SearchListing, place: string) {
  const wanted = normalize(place)
  return (
    normalize(listing.city).includes(wanted) ||
    listing.postalCode.startsWith(wanted) ||
    normalize(listing.departmentCode) === wanted ||
    normalize(listing.departmentName).includes(wanted)
  )
}

const comparators: Record<
  SortValue,
  (a: SearchListing, b: SearchListing) => number
> = {
  recent: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  'prix-croissant': (a, b) => a.priceCents - b.priceCents,
  'prix-decroissant': (a, b) => b.priceCents - a.priceCents,
}

export type SearchResults = {
  items: SearchListing[]
  total: number
  page: number
  pageCount: number
}

export function searchListings(
  listings: readonly SearchListing[],
  criteria: SearchCriteria,
): SearchResults {
  const keyword = criteria.q ? normalize(criteria.q) : ''
  const matches = listings
    .filter(
      (listing) =>
        (!keyword || normalize(listing.title).includes(keyword)) &&
        (!criteria.lieu || matchesPlace(listing, criteria.lieu)) &&
        (!criteria.categorie || listing.category === criteria.categorie) &&
        (!criteria.departement ||
          listing.departmentCode === criteria.departement) &&
        (criteria.prixMin === undefined ||
          listing.priceCents >= criteria.prixMin * 100) &&
        (criteria.prixMax === undefined ||
          listing.priceCents <= criteria.prixMax * 100),
    )
    .sort(comparators[criteria.tri ?? 'recent'])

  const pageCount = Math.max(1, Math.ceil(matches.length / RESULTS_PER_PAGE))
  const page = Math.min(criteria.page ?? 1, pageCount)
  const start = (page - 1) * RESULTS_PER_PAGE

  return {
    items: matches.slice(start, start + RESULTS_PER_PAGE),
    total: matches.length,
    page,
    pageCount,
  }
}

export function describeResults(
  criteria: SearchCriteria,
  total: number,
): { title: string; count: string } {
  const category = searchCategories.find(
    (item) => item.slug === criteria.categorie,
  )
  const subject = criteria.q
    ? `« ${criteria.q} »`
    : (category?.label ?? (criteria.lieu ? 'Annonces' : 'Toutes les annonces'))

  return {
    title: criteria.lieu ? `${subject} à ${criteria.lieu}` : subject,
    count:
      total === 0
        ? 'Aucune annonce'
        : `${total} annonce${total > 1 ? 's' : ''}`,
  }
}

export function listDepartments(
  listings: readonly SearchListing[],
): { code: string; name: string }[] {
  const departments = new Map<string, string>()
  for (const listing of listings) {
    departments.set(listing.departmentCode, listing.departmentName)
  }
  return [...departments]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function formatPrice(priceCents: number): string {
  const digits = priceCents % 100 === 0 ? 0 : 2
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(priceCents / 100)
}

const HOUR_MS = 60 * 60 * 1000

export function formatPublishedAgo(publishedAt: string, now: Date): string {
  const hours = Math.floor(
    (now.getTime() - new Date(publishedAt).getTime()) / HOUR_MS,
  )
  if (hours < 1) return 'À l’instant'
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Hier' : `Il y a ${days} jours`
}
