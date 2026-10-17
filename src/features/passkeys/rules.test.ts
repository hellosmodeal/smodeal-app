import { describe, expect, it } from 'vitest'
import {
  canAddPasskey,
  isAcceptedCredentialId,
  isOwnPasskey,
  relyingParty,
} from './rules'

describe('relyingParty', () => {
  it('lie les clés d’accès au domaine public configuré', () => {
    expect(
      relyingParty('https://smodeal.com', 'http://10.0.0.4:3000/_serverFn/x'),
    ).toEqual({
      id: 'smodeal.com',
      name: 'Smodeal',
      origin: 'https://smodeal.com',
    })
  })

  it('reprend l’origine de la requête sans domaine configuré', () => {
    expect(relyingParty(undefined, 'http://localhost:8670/compte')).toEqual({
      id: 'localhost',
      name: 'Smodeal',
      origin: 'http://localhost:8670',
    })
  })
})

describe('canAddPasskey', () => {
  it('limite un membre à dix clés d’accès', () => {
    expect(canAddPasskey(9)).toBe(true)
    expect(canAddPasskey(10)).toBe(false)
  })
})

describe('isAcceptedCredentialId', () => {
  it('accepte un identifiant base64url de taille raisonnable', () => {
    expect(isAcceptedCredentialId('AbC-_09')).toBe(true)
  })

  it('refuse un identifiant vide, trop long ou hors base64url', () => {
    expect(isAcceptedCredentialId('')).toBe(false)
    expect(isAcceptedCredentialId('a'.repeat(257))).toBe(false)
    expect(isAcceptedCredentialId('a+b/c=')).toBe(false)
  })
})

describe('isOwnPasskey', () => {
  it('ne reconnaît que les clés d’accès du membre connecté', () => {
    expect(isOwnPasskey({ userId: 'u1' }, 'u1')).toBe(true)
    expect(isOwnPasskey({ userId: 'u2' }, 'u1')).toBe(false)
    expect(isOwnPasskey(null, 'u1')).toBe(false)
  })
})
