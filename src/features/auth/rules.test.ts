import { describe, expect, it } from 'vitest'

import {
  authFieldErrors,
  authRedirectSearchSchema,
  callbackUrl,
  isActiveUser,
  isAdmin,
  isSafeInternalPath,
  safeRedirect,
  sessionCookieName,
  sessionCookieOptions,
  signInSchema,
  signUpSchema,
} from './rules'

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

describe('isActiveUser', () => {
  it('refuse une session dont le compte est suspendu', () => {
    expect(isActiveUser({ status: false })).toBe(false)
  })

  it('accepte un compte actif', () => {
    expect(isActiveUser({ status: true })).toBe(true)
  })
})

describe('callbackUrl', () => {
  it('construit un retour sur l’origine publique configurée', () => {
    expect(callbackUrl('https://smodeal.fr', '/verification-email')).toBe(
      'https://smodeal.fr/verification-email',
    )
  })

  it('refuse d’envoyer un lien si aucune origine publique n’est configurée', () => {
    expect(() => callbackUrl(undefined, '/verification-email')).toThrow(
      'PUBLIC_SITE_URL',
    )
  })
})

describe('isSafeInternalPath', () => {
  it('accepte un chemin local', () => {
    expect(isSafeInternalPath('/compte')).toBe(true)
  })

  it('refuse les URL de protocole relatif', () => {
    expect(isSafeInternalPath('//exemple.fr')).toBe(false)
  })

  it('refuse les barres obliques inverses et les caractères de contrôle', () => {
    expect(isSafeInternalPath('/\\\\exemple.fr')).toBe(false)
    expect(isSafeInternalPath('/%5cexemple.fr')).toBe(false)
    expect(isSafeInternalPath('/%0d%0aLocation:%20https://exemple.fr')).toBe(
      false,
    )
  })
})

describe('safeRedirect', () => {
  it('conserve un chemin interne', () => {
    expect(safeRedirect('/annonces/abc?x=1')).toBe('/annonces/abc?x=1')
  })

  it('ignore une redirection externe ou absente', () => {
    expect(safeRedirect('https://exemple.fr')).toBeUndefined()
    expect(safeRedirect('//exemple.fr')).toBeUndefined()
    expect(safeRedirect(undefined)).toBeUndefined()
  })
})

describe('authRedirectSearchSchema', () => {
  it('accepte une redirection interne', () => {
    expect(authRedirectSearchSchema.parse({ redirect: '/deposer' })).toEqual({
      redirect: '/deposer',
    })
  })

  it('écarte une redirection externe ou mal formée sans échouer', () => {
    expect(
      authRedirectSearchSchema.parse({ redirect: 'https://exemple.fr' }),
    ).toEqual({ redirect: undefined })
    expect(authRedirectSearchSchema.parse({ redirect: 42 })).toEqual({
      redirect: undefined,
    })
  })
})

describe('authFieldErrors', () => {
  it('explique chaque champ d’inscription invalide en français', () => {
    expect(
      authFieldErrors(signUpSchema, {
        name: ' a ',
        email: 'pas-un-email',
        password: 'court',
      }),
    ).toEqual({
      name: 'Le pseudonyme doit contenir au moins 2 caractères.',
      email: 'Saisissez une adresse email valide.',
      password: 'Le mot de passe doit contenir au moins 8 caractères.',
    })
  })

  it('ne signale rien pour une inscription valide', () => {
    expect(
      authFieldErrors(signUpSchema, {
        name: 'Camille',
        email: 'camille@example.test',
        password: 'mot-de-passe-solide',
      }),
    ).toEqual({})
  })

  it('demande les champs vides de connexion', () => {
    expect(authFieldErrors(signInSchema, { email: '', password: '' })).toEqual({
      email: 'Saisissez une adresse email valide.',
      password: 'Le mot de passe doit contenir au moins 8 caractères.',
    })
  })
})
