import { describe, expect, it } from 'vitest'
import type { SellerContact, Viewer } from './rules'
import { canRevealPhone } from './rules'

const contact: SellerContact = { ownerId: 'seller-1', displayConsent: true }
const member: Viewer = { id: 'buyer-1', suspended: false }

describe('canRevealPhone', () => {
  it('refuse un visiteur non connecté', () => {
    expect(canRevealPhone(null, contact)).toBe(false)
  })

  it('autorise un membre connecté quand le vendeur accepte l’affichage', () => {
    expect(canRevealPhone(member, contact)).toBe(true)
  })

  it('refuse quand le vendeur n’a pas donné son accord', () => {
    expect(canRevealPhone(member, { ...contact, displayConsent: false })).toBe(
      false,
    )
  })

  it('refuse un membre suspendu', () => {
    expect(canRevealPhone({ ...member, suspended: true }, contact)).toBe(false)
  })

  it('autorise le vendeur à voir son propre numéro', () => {
    expect(
      canRevealPhone(
        { id: 'seller-1', suspended: false },
        { ...contact, displayConsent: false },
      ),
    ).toBe(true)
  })
})
