import { createServerFn } from '@tanstack/react-start'
import { buildDemoListings } from './demo-listings'
import {
  listDepartments,
  parseSearchCriteria,
  type SearchListing,
  type SearchResults,
  searchListings,
} from './rules'

export type SearchPageData = SearchResults & {
  departments: { code: string; name: string }[]
  generatedAt: string
  isDemo: true
}

export const findListings = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) =>
    parseSearchCriteria(
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)
        : {},
    ),
  )
  .handler(({ data }): SearchPageData => {
    const now = new Date()
    const listings: SearchListing[] = buildDemoListings(now)
    return {
      ...searchListings(listings, data),
      departments: listDepartments(listings),
      generatedAt: now.toISOString(),
      isDemo: true,
    }
  })
