import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getPublicListing, listPublicListings } from './listings.server'
import {
  listDepartments,
  parseSearchCriteria,
  requiresLongerKeyword,
  type SearchResults,
} from './rules'

export type SearchPageData = SearchResults & {
  departments: { code: string; name: string }[]
  generatedAt: string
  keywordTooShort: boolean
}

export const findListings = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) =>
    parseSearchCriteria(
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)
        : {},
    ),
  )
  .handler(async ({ data }): Promise<SearchPageData> => {
    const now = new Date()
    if (requiresLongerKeyword(data)) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageCount: 1,
        departments: [],
        generatedAt: now.toISOString(),
        keywordTooShort: true,
      }
    }
    const results = await listPublicListings(data, now)
    return {
      ...results,
      departments: listDepartments(results.items),
      generatedAt: now.toISOString(),
      keywordTooShort: false,
    }
  })

export const findPublicListing = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ listingId: z.string().regex(/^[A-Za-z0-9._-]{1,36}$/) }),
  )
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return getPublicListing(data.listingId, new Date())
  })
