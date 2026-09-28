import { describe, expect, it } from 'vitest'
import type { ListingLifecycle } from './rules'
import {
  canChangeListingStatus,
  canEditListing,
  canManageListing,
  canRenewListing,
  computeExpiresAt,
  hasExpectedPhotoSignature,
  isPubliclyVisible,
  photoValidationMessage,
} from './rules'

const now = new Date('2026-10-01T12:00:00.000Z')

function listing(overrides: Partial<ListingLifecycle> = {}): ListingLifecycle {
  return {
    ownerId: 'seller-1',
    status: 'active',
    expiresAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('computeExpiresAt', () => {
  it('expire 60 jours après la publication', () => {
    expect(computeExpiresAt(new Date('2026-10-01T12:00:00.000Z'))).toBe(
      '2026-11-30T12:00:00.000Z',
    )
  })
})

describe('hasExpectedPhotoSignature', () => {
  it('refuse du contenu HTML déguisé en image PNG', () => {
    expect(
      hasExpectedPhotoSignature(
        new TextEncoder().encode('<html>contenu non image</html>'),
        'image/png',
      ),
    ).toBe(false)
  })

  it('accepte la signature PNG', () => {
    expect(
      hasExpectedPhotoSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/png',
      ),
    ).toBe(true)
  })
})

describe('isPubliclyVisible', () => {
  it('affiche une annonce active non expirée', () => {
    expect(isPubliclyVisible(listing(), now)).toBe(true)
  })

  it("masque une annonce active dont la date d'expiration est dépassée", () => {
    expect(
      isPubliclyVisible(
        listing({ expiresAt: '2026-10-01T11:59:59.000Z' }),
        now,
      ),
    ).toBe(false)
  })

  it.each(['sold', 'expired', 'withdrawn', 'removed_by_moderation'] as const)(
    'masque une annonce au statut %s',
    (status) => {
      expect(isPubliclyVisible(listing({ status }), now)).toBe(false)
    },
  )
})

describe('canManageListing', () => {
  it('autorise le propriétaire', () => {
    expect(canManageListing(listing(), 'seller-1')).toBe(true)
  })

  it('refuse un autre membre', () => {
    expect(canManageListing(listing(), 'seller-2')).toBe(false)
  })

  it('refuse le propriétaire si la modération a retiré l’annonce', () => {
    expect(
      canManageListing(
        listing({ status: 'removed_by_moderation' }),
        'seller-1',
      ),
    ).toBe(false)
  })
})

describe('canEditListing', () => {
  it.each(['active', 'expired'] as const)(
    'autorise le propriétaire à modifier une annonce %s',
    (status) => {
      expect(canEditListing(listing({ status }), 'seller-1')).toBe(true)
    },
  )

  it.each(['sold', 'withdrawn', 'removed_by_moderation'] as const)(
    'refuse la modification d’une annonce %s',
    (status) => {
      expect(canEditListing(listing({ status }), 'seller-1')).toBe(false)
    },
  )
})

describe('canRenewListing', () => {
  it('autorise le propriétaire à renouveler une annonce expirée', () => {
    expect(
      canRenewListing(listing({ status: 'expired' }), 'seller-1', now),
    ).toBe(true)
  })

  it('autorise le renouvellement d’une annonce active dont la date est dépassée', () => {
    expect(
      canRenewListing(
        listing({ expiresAt: '2026-09-30T12:00:00.000Z' }),
        'seller-1',
        now,
      ),
    ).toBe(true)
  })

  it('refuse le renouvellement d’une annonce active encore valide', () => {
    expect(canRenewListing(listing(), 'seller-1', now)).toBe(false)
  })

  it('refuse un autre membre', () => {
    expect(
      canRenewListing(listing({ status: 'expired' }), 'seller-2', now),
    ).toBe(false)
  })

  it.each(['removed_by_moderation', 'sold', 'withdrawn'] as const)(
    'refuse le renouvellement au statut %s',
    (status) => {
      expect(canRenewListing(listing({ status }), 'seller-1', now)).toBe(false)
    },
  )
})

describe('photoValidationMessage', () => {
  it('accepte une photo WebP de moins de 5 Mo', () => {
    expect(
      photoValidationMessage({
        name: 'lampe.webp',
        type: 'image/webp',
        size: 42,
      }),
    ).toBeNull()
  })

  it('refuse un format de photo non pris en charge', () => {
    expect(
      photoValidationMessage({
        name: 'lampe.gif',
        type: 'image/gif',
        size: 42,
      }),
    ).toBe('Les photos doivent être au format JPG, PNG ou WebP.')
  })
})

describe('canChangeListingStatus', () => {
  it('autorise le vendeur à marquer son annonce active comme vendue', () => {
    expect(canChangeListingStatus(listing(), 'seller-1')).toBe(true)
  })

  it('refuse le changement de statut demandé par un autre membre', () => {
    expect(canChangeListingStatus(listing(), 'seller-2')).toBe(false)
  })
})
