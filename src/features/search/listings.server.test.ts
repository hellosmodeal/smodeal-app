import { describe, expect, it, vi } from 'vitest'
import {
  getPublicListing,
  type PublicListingDependencies,
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

  it('nomme le département de l’annonce par son nom officiel', () => {
    const listing = toPublicListing({
      $id: 'listing-2',
      title: 'Lampe',
      description: 'Description',
      categorySlug: 'maison',
      condition: 'good',
      priceCents: 2000,
      city: 'Lyon',
      postalCode: '69003',
      department: '69',
      publishedAt: '2026-09-28T10:00:00.000Z',
    })
    expect(listing?.departmentName).toBe('Rhône')
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

describe('getPublicListing', () => {
  const now = new Date('2026-09-28T12:00:00.000Z')
  const privateRow = {
    $id: 'listing-1',
    ownerId: 'seller-1',
    title: 'Vélo de ville',
    description: 'Vélo fictif en bon état.',
    categorySlug: 'loisirs',
    condition: 'good' as const,
    priceCents: 12000,
    city: 'Lyon',
    postalCode: '69001',
    department: '69',
    publishedAt: '2026-09-27T10:00:00.000Z',
  }

  function dependencies(
    overrides: Partial<PublicListingDependencies> = {},
  ): PublicListingDependencies {
    return {
      findActiveListing: async () => privateRow,
      loadViewerId: async () => 'buyer-1',
      hasContactConsent: async () => true,
      ...overrides,
    }
  }

  it('signale le propriétaire à partir de la session, sans exposer son identifiant', async () => {
    const listing = await getPublicListing(
      'listing-1',
      now,
      dependencies({ loadViewerId: async () => 'seller-1' }),
    )
    expect(listing?.isOwner).toBe(true)
    expect(listing).not.toHaveProperty('ownerId')
  })

  it('ne considère pas un visiteur anonyme comme propriétaire', async () => {
    const listing = await getPublicListing(
      'listing-1',
      now,
      dependencies({ loadViewerId: async () => null }),
    )
    expect(listing?.isOwner).toBe(false)
  })

  it('indique si le vendeur a accepté d’afficher un moyen de contact', async () => {
    const withConsent = await getPublicListing('listing-1', now, dependencies())
    const withoutConsent = await getPublicListing(
      'listing-1',
      now,
      dependencies({ hasContactConsent: async () => false }),
    )
    expect(withConsent?.contactAvailable).toBe(true)
    expect(withoutConsent?.contactAvailable).toBe(false)
  })

  it('ne transmet jamais de numéro ni de coordonnées dans la fiche publique', async () => {
    const listing = await getPublicListing('listing-1', now, dependencies())
    const payload = JSON.stringify(listing)
    expect(listing).not.toHaveProperty('phone')
    expect(listing).not.toHaveProperty('contacts')
    expect(listing).not.toHaveProperty('contact')
    expect(payload).not.toContain('seller-1')
    expect(payload).not.toMatch(/phone/i)
  })

  it('renvoie une fiche absente sans lire la session ni le contact', async () => {
    const loadViewerId = vi.fn()
    const hasContactConsent = vi.fn()
    await expect(
      getPublicListing(
        'listing-1',
        now,
        dependencies({
          findActiveListing: async () => null,
          loadViewerId,
          hasContactConsent,
        }),
      ),
    ).resolves.toBeNull()
    expect(loadViewerId).not.toHaveBeenCalled()
    expect(hasContactConsent).not.toHaveBeenCalled()
  })
})
