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
  it('permet de désactiver l’indexation sans changer l’origine des callbacks', () => {
    const env = parseServerEnv({
      ...valid,
      PUBLIC_SITE_URL: 'https://recette.example.invalid',
      PUBLIC_SITE_INDEXABLE: 'false',
    })
    expect(env.PUBLIC_SITE_INDEXABLE).toBe(false)
    expect(env.PUBLIC_SITE_URL).toBe('https://recette.example.invalid')
    expect(parseServerEnv(valid).PUBLIC_SITE_INDEXABLE).toBe(true)
    expect(
      parseServerEnv({ ...valid, PUBLIC_SITE_INDEXABLE: '' })
        .PUBLIC_SITE_INDEXABLE,
    ).toBe(true)
    expect(
      parseServerEnv({ ...valid, PUBLIC_SITE_INDEXABLE: 'true' })
        .PUBLIC_SITE_INDEXABLE,
    ).toBe(true)
  })

  it('refuse un réglage d’indexation ambigu', () => {
    expect(() =>
      parseServerEnv({ ...valid, PUBLIC_SITE_INDEXABLE: 'yes' }),
    ).toThrow('PUBLIC_SITE_INDEXABLE')
  })
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

const base = {
  APPWRITE_ENDPOINT: 'http://127.0.0.1:18670/v1',
  APPWRITE_PROJECT_ID: 'smodeal-qa',
  APPWRITE_API_KEY: 'fictitious-qa-key',
  APPWRITE_DATABASE_ID: 'smodeal',
}

describe('configuration des callbacks de recette', () => {
  it('refuse un callback local si Appwrite est distant', () => {
    expect(() =>
      parseServerEnv({
        ...base,
        APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
        NODE_ENV: 'development',
        PUBLIC_SITE_URL: 'http://localhost:18671',
      }),
    ).toThrow('PUBLIC_SITE_URL')
  })
  it('autorise le serveur local HTTP en développement', () => {
    expect(
      parseServerEnv({
        ...base,
        NODE_ENV: 'development',
        PUBLIC_SITE_URL: 'http://localhost:18671',
      }).PUBLIC_SITE_URL,
    ).toBe('http://localhost:18671')
  })
  it('interdit le serveur local HTTP en production', () => {
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: 'production',
        PUBLIC_SITE_URL: 'http://localhost:18671',
      }),
    ).toThrow('PUBLIC_SITE_URL')
  })
  it('interdit une origine HTTP distante même en développement', () => {
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: 'development',
        PUBLIC_SITE_URL: 'http://smodeal.com',
      }),
    ).toThrow('PUBLIC_SITE_URL')
  })
  it('conserve les origines HTTPS en production', () => {
    expect(
      parseServerEnv({
        ...base,
        NODE_ENV: 'production',
        PUBLIC_SITE_URL: 'https://smodeal.com',
      }).PUBLIC_SITE_URL,
    ).toBe('https://smodeal.com')
  })
})
