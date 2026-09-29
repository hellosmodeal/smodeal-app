import { describe, expect, it } from 'vitest'
import { assertMutationSucceeded } from './result'

describe('le résultat des mutations limitées', () => {
  it('interrompt la suite du parcours lorsque le serveur refuse l’action', () => {
    expect(() =>
      assertMutationSucceeded({ ok: false, message: 'Trop de tentatives.' }),
    ).toThrow('Trop de tentatives.')
  })

  it('accepte les réponses normales des mutations vendeur', () => {
    expect(() => assertMutationSucceeded({ id: 'annonce' })).not.toThrow()
    expect(() => assertMutationSucceeded(undefined)).not.toThrow()
  })
})
