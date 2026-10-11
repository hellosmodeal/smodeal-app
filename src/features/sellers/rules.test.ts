import { describe, expect, it } from 'vitest'
import { describeSellerListings, formatMemberSince } from './rules'

describe('formatMemberSince', () => {
  it('indique le mois et l’année d’inscription en français', () => {
    expect(formatMemberSince('2026-09-28T10:00:00.000Z')).toBe(
      'Membre depuis septembre 2026',
    )
  })

  it('utilise le fuseau de Paris pour une inscription en fin de mois', () => {
    expect(formatMemberSince('2026-09-30T23:30:00.000Z')).toBe(
      'Membre depuis octobre 2026',
    )
  })
})

describe('describeSellerListings', () => {
  it('accorde le nombre d’annonces en ligne', () => {
    expect(describeSellerListings(0)).toBe('Aucune annonce en ligne')
    expect(describeSellerListings(1)).toBe('1 annonce en ligne')
    expect(describeSellerListings(3)).toBe('3 annonces en ligne')
  })
})
