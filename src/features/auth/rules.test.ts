import { describe, expect, it } from 'vitest'

import { isAdmin, sessionCookieName, sessionCookieOptions } from './rules'

describe('sessionCookieName', () => {
  it('suit la convention Appwrite a_session_<projet>', () => {
    expect(sessionCookieName('smodeal-prod')).toBe('a_session_smodeal-prod')
  })
})

describe('sessionCookieOptions', () => {
  const expire = '2027-09-26T10:00:00.000Z'

  it('pose un cookie httpOnly, lax, sur tout le site, expirant avec la session', () => {
    expect(sessionCookieOptions({ expire }, { secure: true })).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(expire),
    })
  })

  it('permet un cookie non sécurisé en développement local', () => {
    expect(sessionCookieOptions({ expire }, { secure: false }).secure).toBe(
      false,
    )
  })
})

describe('isAdmin', () => {
  it('reconnaît le libellé admin', () => {
    expect(isAdmin({ labels: ['admin'] })).toBe(true)
  })

  it('refuse un membre sans libellé admin', () => {
    expect(isAdmin({ labels: ['beta'] })).toBe(false)
  })
})
