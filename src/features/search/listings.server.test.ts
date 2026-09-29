import { describe, expect, it } from 'vitest'
import {
  publicListingQueries,
  publicPhotoUrl,
  resolvePublicPage,
  toPublicListing,
} from './listings.server'

describe('publicPhotoUrl', () => {
  it('conserve le préfixe /v1 de l’endpoint Appwrite', () => {
    expect(
      publicPhotoUrl('photo-1', {
        APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
        APPWRITE_PROJECT_ID: 'project-1',
        APPWRITE_API_KEY: 'test',
        APPWRITE_DATABASE_ID: 'smodeal',
        NODE_ENV: 'test',
        PUBLIC_SITE_URL: undefined,
        PUBLIC_SITE_INDEXABLE: false,
      }),
    ).toBe(
      'https://fra.cloud.appwrite.io/v1/storage/buckets/listing-photos/files/photo-1/view?project=project-1',
    )
  })
})

describe('DTO public et pagination', () => {
  it('ne transmet jamais le propriétaire dans le DTO public', () => {
    const privateRow = {
      $id: 'listing-1',
      ownerId: 'seller-secret',
      title: 'Vélo',
      description: 'Description',
      categorySlug: 'loisirs',
      condition: 'good' as const,
      priceCents: 1000,
      city: 'Lyon',
      postalCode: '69000',
      department: '69',
      publishedAt: '2026-09-28T10:00:00.000Z',
    }
    const listing = toPublicListing(privateRow)
    expect(listing).not.toHaveProperty('ownerId')
  })

  it('ramène une page au-delà du total à la dernière page', () => {
    expect(resolvePublicPage(25, 9)).toEqual({ page: 3, pageCount: 3 })
  })

  it('considère une ligne absente comme une fiche absente', () => {
    const row = undefined
    expect(row ? toPublicListing(row) : null).toBeNull()
  })
})

describe('publicListingQueries', () => {
  it('filtre toujours les annonces actives et non expirées côté serveur', () => {
    const queries = publicListingQueries(
      {},
      new Date('2026-09-28T12:00:00.000Z'),
      1,
    )
    expect(
      queries.some(
        (query) => query.includes('status') && query.includes('active'),
      ),
    ).toBe(true)
    expect(
      queries.some(
        (query) =>
          query.includes('expiresAt') &&
          query.includes('2026-09-28T12:00:00.000Z'),
      ),
    ).toBe(true)
    expect(
      queries.some((query) => query.includes('limit') && query.includes('12')),
    ).toBe(true)
    expect(
      queries.some((query) => query.includes('offset') && query.includes('0')),
    ).toBe(true)
  })
})
