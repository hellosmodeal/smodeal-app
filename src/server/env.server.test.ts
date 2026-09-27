import { describe, expect, it } from 'vitest'

import { parseServerEnv } from './env.server'

const valid = {
  APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: 'smodeal-dev',
  APPWRITE_API_KEY: 'standard_key',
  APPWRITE_DATABASE_ID: 'smodeal',
  NODE_ENV: 'development',
}

describe('parseServerEnv', () => {
  it('retourne la configuration Appwrite validée', () => {
    expect(parseServerEnv(valid)).toMatchObject({
      APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
      APPWRITE_PROJECT_ID: 'smodeal-dev',
      APPWRITE_DATABASE_ID: 'smodeal',
    })
  })

  it('échoue sans clé API serveur', () => {
    const { APPWRITE_API_KEY: _omitted, ...rest } = valid
    expect(() => parseServerEnv(rest)).toThrow(/APPWRITE_API_KEY/)
  })

  it('refuse un endpoint qui n’est pas une URL', () => {
    expect(() =>
      parseServerEnv({ ...valid, APPWRITE_ENDPOINT: 'fra.cloud' }),
    ).toThrow(/APPWRITE_ENDPOINT/)
  })

  it('accepte une URL publique HTTPS et la laisse optionnelle', () => {
    expect(parseServerEnv(valid).PUBLIC_SITE_URL).toBeUndefined()
    expect(
      parseServerEnv({ ...valid, PUBLIC_SITE_URL: '' }).PUBLIC_SITE_URL,
    ).toBeUndefined()
    expect(
      parseServerEnv({ ...valid, PUBLIC_SITE_URL: 'https://smodeal.fr' })
        .PUBLIC_SITE_URL,
    ).toBe('https://smodeal.fr')
  })

  it('refuse une URL publique non sécurisée', () => {
    expect(() =>
      parseServerEnv({ ...valid, PUBLIC_SITE_URL: 'http://smodeal.fr' }),
    ).toThrow(/PUBLIC_SITE_URL/)
  })
})
