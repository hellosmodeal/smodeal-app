import { describe, expect, it } from 'vitest'
import {
  hasPendingLegalFields,
  type LegalDocument,
  legalDocuments,
  todo,
} from './content'

const completeDocument: LegalDocument = {
  path: '/exemple',
  title: 'Exemple',
  description: 'Document fictif complet.',
  updatedAt: ['1er octobre 2026'],
  sections: [
    {
      heading: 'Éditeur',
      paragraphs: [['Société fictive, 1 rue de l’Exemple, 75000 Paris.']],
      items: [['Contact : contact@example.test']],
    },
  ],
}

describe('hasPendingLegalFields', () => {
  it('considère un document entièrement rempli comme publiable', () => {
    expect(hasPendingLegalFields(completeDocument)).toBe(false)
  })

  it('détecte un champ à compléter dans un paragraphe', () => {
    const document: LegalDocument = {
      ...completeDocument,
      sections: [
        {
          heading: 'Éditeur',
          paragraphs: [['SIREN : ', todo('numéro SIREN')]],
        },
      ],
    }

    expect(hasPendingLegalFields(document)).toBe(true)
  })

  it('détecte un champ à compléter dans une liste', () => {
    const document: LegalDocument = {
      ...completeDocument,
      sections: [
        {
          heading: 'Conservation',
          paragraphs: [['Durées applicables :']],
          items: [['Annonces : ', todo('durée de conservation')]],
        },
      ],
    }

    expect(hasPendingLegalFields(document)).toBe(true)
  })

  it('détecte une date de mise à jour à compléter', () => {
    expect(
      hasPendingLegalFields({
        ...completeDocument,
        updatedAt: [todo('date de validation')],
      }),
    ).toBe(true)
  })

  it('garde les quatre pages légales hors index tant qu’elles contiennent des champs à compléter', () => {
    expect(legalDocuments.map((document) => document.path)).toEqual([
      '/mentions-legales',
      '/cgu',
      '/confidentialite',
      '/cookies',
    ])
    for (const document of legalDocuments) {
      expect(hasPendingLegalFields(document)).toBe(true)
    }
  })
})
