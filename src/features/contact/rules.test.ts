import { describe, expect, it } from 'vitest'
import type { SellerContact, Viewer } from './rules'
import { canRevealPhone, formatPhoneForDisplay } from './rules'

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

describe('formatPhoneForDisplay', () => {
  it.each([
    ['0600000001', '06 00 00 00 01'],
    ['06.00.00.00.01', '06 00 00 00 01'],
    ['+33600000001', '+33 6 00 00 00 01'],
    ['+33 (0)6 00 00 00 01', '+33 (0)6 00 00 00 01'],
  ])('affiche %s comme %s', (input, expected) => {
    expect(formatPhoneForDisplay(input)).toBe(expected)
  })
})
