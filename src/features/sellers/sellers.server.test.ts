import { describe, expect, it, vi } from 'vitest'
import {
  getPublicSellerProfile,
  type SellerProfileDependencies,
} from './sellers.server'

const now = new Date('2026-10-11T12:00:00.000Z')

const listingRow = {
  $id: 'listing-1',
  title: 'Vélo de ville',
  description: 'Vélo fictif.',
  categorySlug: 'loisirs',
  condition: 'good' as const,
  priceCents: 12000,
  city: 'Lyon',
  postalCode: '69001',
  department: '69',
  publishedAt: '2026-10-10T10:00:00.000Z',
}

function dependencies(
  overrides: Partial<SellerProfileDependencies> = {},
): SellerProfileDependencies {
  return {
    findProfile: async () => ({ userId: 'seller-1', pseudonym: 'Marie L.' }),
    findMember: async () => ({
      createdAt: '2026-09-28T10:00:00.000Z',
      active: true,
    }),
    listActiveListings: async () => ({ rows: [listingRow], total: 1 }),
    ...overrides,
  }
}

describe('getPublicSellerProfile', () => {
  it('présente le pseudonyme, l’ancienneté et les annonces en ligne du vendeur', async () => {
    const profile = await getPublicSellerProfile(
      'profile-1',
      now,
      dependencies(),
    )
    expect(profile).toMatchObject({
      pseudonym: 'Marie L.',
      memberSince: '2026-09-28T10:00:00.000Z',
      total: 1,
    })
    expect(profile?.listings.map((listing) => listing.id)).toEqual([
      'listing-1',
    ])
  })

  it('cherche les annonces du compte rattaché au profil', async () => {
    const listActiveListings = vi.fn(async () => ({ rows: [], total: 0 }))
    await getPublicSellerProfile(
      'profile-1',
      now,
      dependencies({ listActiveListings }),
    )
    expect(listActiveListings).toHaveBeenCalledWith('seller-1', now)
  })

  it('ne transmet jamais l’identifiant du compte du vendeur', async () => {
    const profile = await getPublicSellerProfile(
      'profile-1',
      now,
      dependencies(),
    )
    expect(JSON.stringify(profile)).not.toContain('seller-1')
  })

  it('renvoie un profil absent quand il n’existe pas', async () => {
    const findMember = vi.fn()
    await expect(
      getPublicSellerProfile(
        'profile-1',
        now,
        dependencies({ findProfile: async () => null, findMember }),
      ),
    ).resolves.toBeNull()
    expect(findMember).not.toHaveBeenCalled()
  })

  it('masque le profil d’un vendeur suspendu', async () => {
    const listActiveListings = vi.fn()
    await expect(
      getPublicSellerProfile(
        'profile-1',
        now,
        dependencies({
          findMember: async () => ({
            createdAt: '2026-09-28T10:00:00.000Z',
            active: false,
          }),
          listActiveListings,
        }),
      ),
    ).resolves.toBeNull()
    expect(listActiveListings).not.toHaveBeenCalled()
  })

  it('masque le profil d’un compte supprimé', async () => {
    await expect(
      getPublicSellerProfile(
        'profile-1',
        now,
        dependencies({ findMember: async () => null }),
      ),
    ).resolves.toBeNull()
  })
})
