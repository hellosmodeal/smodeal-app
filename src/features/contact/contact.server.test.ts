import { describe, expect, it, vi } from 'vitest'
import {
  type PhoneRevealDependencies,
  revealListingPhone,
} from './contact.server'

function dependencies(
  overrides: Partial<PhoneRevealDependencies> = {},
): PhoneRevealDependencies {
  return {
    loadViewer: async () => ({ id: 'buyer-1', suspended: false }),
    findActiveListing: async () => ({ ownerId: 'seller-1' }),
    findContact: async () => ({ phone: '0600000000', displayConsent: true }),
    ...overrides,
  }
}

describe('revealListingPhone', () => {
  it('refuse un visiteur anonyme avant toute lecture', async () => {
    const findListing = vi.fn()
    const findContact = vi.fn()
    await expect(
      revealListingPhone(
        'listing-1',
        dependencies({
          loadViewer: async () => null,
          findActiveListing: findListing,
          findContact,
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: 'Connectez-vous pour voir le numéro.',
    })
    expect(findListing).not.toHaveBeenCalled()
    expect(findContact).not.toHaveBeenCalled()
  })

  it('ne consulte pas le contact quand l’annonce active et non expirée est absente', async () => {
    const findContact = vi.fn()
    await expect(
      revealListingPhone(
        'listing-1',
        dependencies({ findActiveListing: async () => null, findContact }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: 'Cette annonce n’est plus disponible.',
    })
    expect(findContact).not.toHaveBeenCalled()
  })

  it('refuse sans consentement du vendeur', async () => {
    await expect(
      revealListingPhone(
        'listing-1',
        dependencies({
          findContact: async () => ({
            phone: '0600000000',
            displayConsent: false,
          }),
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: 'Le vendeur ne souhaite pas afficher son numéro.',
    })
  })

  it('refuse un compte suspendu', async () => {
    await expect(
      revealListingPhone(
        'listing-1',
        dependencies({
          loadViewer: async () => ({ id: 'buyer-1', suspended: true }),
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: 'Le vendeur ne souhaite pas afficher son numéro.',
    })
  })
})
