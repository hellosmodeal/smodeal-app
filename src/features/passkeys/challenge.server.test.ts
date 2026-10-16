import { describe, expect, it } from 'vitest'
import { openPasskeyChallenge, sealPasskeyChallenge } from './challenge.server'

const now = new Date('2026-10-12T10:00:00Z')
const value = { purpose: 'signin', challenge: 'abc', userId: '' } as const

describe('défi de clé d’accès scellé', () => {
  it('restitue le défi émis par le serveur pendant cinq minutes', () => {
    const sealed = sealPasskeyChallenge('secret', value, now)

    expect(
      openPasskeyChallenge(
        'secret',
        sealed,
        'signin',
        new Date(now.getTime() + 299_000),
      ),
    ).toMatchObject(value)
  })

  it('refuse un défi expiré', () => {
    const sealed = sealPasskeyChallenge('secret', value, now)

    expect(
      openPasskeyChallenge(
        'secret',
        sealed,
        'signin',
        new Date(now.getTime() + 300_000),
      ),
    ).toBeNull()
  })

  it('refuse un défi modifié, signé avec un autre secret ou d’un autre usage', () => {
    const sealed = sealPasskeyChallenge('secret', value, now)
    const [, signature] = sealed.split('.')
    const forged = `${Buffer.from(
      JSON.stringify({ ...value, challenge: 'choisi', expiresAt: 9e15 }),
    ).toString('base64url')}.${signature}`

    expect(openPasskeyChallenge('secret', forged, 'signin', now)).toBeNull()
    expect(openPasskeyChallenge('autre', sealed, 'signin', now)).toBeNull()
    expect(openPasskeyChallenge('secret', sealed, 'register', now)).toBeNull()
    expect(openPasskeyChallenge('secret', undefined, 'signin', now)).toBeNull()
    expect(openPasskeyChallenge('secret', 'a.b.c', 'signin', now)).toBeNull()
  })
})
