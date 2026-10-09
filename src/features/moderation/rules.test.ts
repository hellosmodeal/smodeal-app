import { describe, expect, it } from 'vitest'
import {
  moderationDecisionMessage,
  reportedListingStatusLabel,
  suspensionDescription,
} from './rules'

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

describe('moderationDecisionMessage', () => {
  it('confirme chaque décision de modération', () => {
    expect(moderationDecisionMessage('dismiss')).toBe('Signalement classé.')
    expect(moderationDecisionMessage('remove')).toBe('Annonce retirée.')
    expect(moderationDecisionMessage('suspend')).toBe(
      'Vendeur suspendu et annonces retirées.',
    )
  })
})

describe('suspensionDescription', () => {
  it('nomme l’annonce du vendeur à suspendre', () => {
    expect(suspensionDescription('Vélo de ville')).toBe(
      'Le vendeur de « Vélo de ville » verra son compte bloqué, ses sessions fermées et toutes ses annonces retirées.',
    )
  })

  it('reste explicite quand l’annonce a été supprimée', () => {
    expect(suspensionDescription(undefined)).toBe(
      'Le vendeur de l’annonce supprimée verra son compte bloqué, ses sessions fermées et toutes ses annonces retirées.',
    )
  })
})
