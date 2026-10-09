import { describe, expect, it } from 'vitest'
import { memberInitials } from './rules'

describe('memberInitials', () => {
  it('prend la première lettre des deux premiers mots en majuscules', () => {
    expect(memberInitials('camille durand')).toBe('CD')
  })

  it('garde une seule lettre pour un pseudonyme d’un mot', () => {
    expect(memberInitials('  vélo42 ')).toBe('V')
  })

  it('ignore les séparateurs usuels des pseudonymes', () => {
    expect(memberInitials('jean-marc_le.bricoleur')).toBe('JM')
  })

  it('retombe sur un point d’interrogation sans lettre exploitable', () => {
    expect(memberInitials('   ')).toBe('?')
  })
})
