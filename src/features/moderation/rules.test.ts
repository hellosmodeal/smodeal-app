import { describe, expect, it } from 'vitest'
import { reportedListingStatusLabel } from './rules'

describe('reportedListingStatusLabel', () => {
  it('signale une annonce supprimée', () => {
    expect(reportedListingStatusLabel(null)).toBe('Annonce supprimée')
  })

  it('considère une annonce active non visible comme expirée', () => {
    expect(
      reportedListingStatusLabel({
        title: 'Vélo',
        status: 'active',
        publiclyVisible: false,
      }),
    ).toBe('Expirée')
  })

  it('précise qui a retiré l’annonce', () => {
    expect(
      reportedListingStatusLabel({
        title: 'Vélo',
        status: 'withdrawn',
        publiclyVisible: false,
      }),
    ).toBe('Retirée par le vendeur')
  })

  it('reprend le libellé vendeur pour les autres statuts', () => {
    expect(
      reportedListingStatusLabel({
        title: 'Vélo',
        status: 'sold',
        publiclyVisible: false,
      }),
    ).toBe('Vendue')
  })

  it('affiche un statut inconnu tel quel', () => {
    expect(
      reportedListingStatusLabel({
        title: 'Vélo',
        status: 'archived',
        publiclyVisible: false,
      }),
    ).toBe('archived')
  })
})
