import { describe, expect, it } from 'vitest'
import { buildDemoListings } from './demo-listings'
import { searchCategories } from './rules'

const now = new Date('2026-09-27T12:00:00Z')

describe('buildDemoListings', () => {
  it('date les exemples dans le passé récent par rapport à l’horloge', () => {
    for (const listing of buildDemoListings(now)) {
      const age = now.getTime() - new Date(listing.publishedAt).getTime()
      expect(age).toBeGreaterThan(0)
      expect(age).toBeLessThan(30 * 24 * 60 * 60 * 1000)
    }
  })

  it('utilise des identifiants uniques et des catégories connues', () => {
    const listings = buildDemoListings(now)
    const slugs = searchCategories.map((category) => category.slug)

    expect(new Set(listings.map((listing) => listing.id)).size).toBe(
      listings.length,
    )
    for (const listing of listings) {
      expect(slugs).toContain(listing.category)
      expect(listing.id).toMatch(/^exemple-/)
    }
  })

  it('remplit plus d’une page pour démontrer la pagination', () => {
    expect(buildDemoListings(now).length).toBeGreaterThan(12)
  })
})
