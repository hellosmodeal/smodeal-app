import { describe, expect, it } from 'vitest'
import {
  accountFieldErrors,
  canEditAccount,
  privateContactSchema,
  publicProfileSchema,
} from './rules'

describe('canEditAccount', () => {
  it('refuse un visiteur non connecté', () => {
    expect(canEditAccount(null)).toBe(false)
  })

  it('refuse un membre suspendu', () => {
    expect(canEditAccount({ id: 'member-1', suspended: true })).toBe(false)
  })

  it('autorise un membre actif', () => {
    expect(canEditAccount({ id: 'member-1', suspended: false })).toBe(true)
  })
})

describe('publicProfileSchema', () => {
  it('retire les espaces autour du pseudonyme', () => {
    expect(publicProfileSchema.parse({ pseudonym: '  Lina B.  ' })).toEqual({
      pseudonym: 'Lina B.',
    })
  })

  it('refuse un pseudonyme trop court avec un message en français', () => {
    expect(
      accountFieldErrors(publicProfileSchema, { pseudonym: ' a ' }),
    ).toEqual({
      pseudonym: 'Le pseudonyme doit contenir au moins 2 caractères.',
    })
  })

  it('refuse un pseudonyme de plus de 40 caractères', () => {
    expect(
      accountFieldErrors(publicProfileSchema, { pseudonym: 'x'.repeat(41) }),
    ).toEqual({ pseudonym: 'Le pseudonyme est limité à 40 caractères.' })
  })
})

describe('privateContactSchema', () => {
  it('normalise un numéro français saisi avec espaces et points', () => {
    expect(
      privateContactSchema.parse({
        phone: '06 12.34 56-78',
        displayConsent: true,
      }),
    ).toEqual({ phone: '0612345678', displayConsent: true })
  })

  it('accepte un numéro international', () => {
    expect(
      privateContactSchema.parse({
        phone: '+33 6 12 34 56 78',
        displayConsent: false,
      }),
    ).toEqual({ phone: '+33612345678', displayConsent: false })
  })

  it('refuse un numéro invalide avec le message du formulaire de dépôt', () => {
    expect(
      accountFieldErrors(privateContactSchema, {
        phone: '12345',
        displayConsent: false,
      }),
    ).toEqual({ phone: 'Indiquez un numéro de téléphone valide.' })
  })

  it('exige un choix explicite d’affichage du numéro', () => {
    expect(
      accountFieldErrors(privateContactSchema, {
        phone: '0612345678',
        displayConsent: 'on',
      }),
    ).toEqual({ displayConsent: 'Indiquez si votre numéro peut être affiché.' })
  })
})
