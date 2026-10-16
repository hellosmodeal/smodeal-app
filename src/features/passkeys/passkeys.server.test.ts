import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { describe, expect, it, vi } from 'vitest'
import {
  beginPasskeyRegistration,
  beginPasskeySignIn,
  completePasskeyRegistration,
  completePasskeySignIn,
  listMemberPasskeys,
  type PasskeyDependencies,
  removeMemberPasskey,
  type StoredPasskey,
} from './passkeys.server'

vi.mock('@/features/auth/session.server', () => ({
  adminClient: vi.fn(),
  loadCurrentUser: vi.fn(),
}))

const rp = { id: 'localhost', name: 'Smodeal', origin: 'http://localhost:8670' }
const now = new Date('2026-10-12T10:00:00Z')
const member = {
  id: 'membre-1',
  name: 'Camille Test',
  email: 'camille@example.test',
  suspended: false,
}

function stored(overrides: Partial<StoredPasskey> = {}): StoredPasskey {
  return {
    rowId: 'cle-1',
    userId: member.id,
    credentialId: 'Y3JlZA',
    publicKey: 'AQID',
    counter: 3,
    transports: ['internal'],
    createdAt: '2026-10-01T10:00:00.000Z',
    lastUsedAt: null,
    ...overrides,
  }
}

function dependencies(
  overrides: Partial<PasskeyDependencies<string>> = {},
): PasskeyDependencies<string> {
  return {
    loadMember: async () => member,
    listPasskeys: async () => [],
    findPasskey: async () => null,
    findPasskeyByRowId: async () => null,
    savePasskey: vi.fn(async () => {}),
    recordUse: vi.fn(async () => {}),
    deletePasskey: vi.fn(async () => {}),
    isActiveMember: async () => true,
    createSession: async (userId) => `session-${userId}`,
    verifyRegistration: vi.fn(async () => ({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'bm91dmVsbGU',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['internal', 'inconnu'],
        },
      },
    })) as unknown as PasskeyDependencies['verifyRegistration'],
    verifyAuthentication: vi.fn(async () => ({
      verified: true,
      authenticationInfo: { newCounter: 4 },
    })) as unknown as PasskeyDependencies['verifyAuthentication'],
    now: () => now,
    ...overrides,
  }
}

const registration = {
  id: 'bm91dmVsbGU',
  rawId: 'bm91dmVsbGU',
  type: 'public-key',
  clientExtensionResults: {},
  response: { clientDataJSON: 'e30', attestationObject: 'AA' },
} as RegistrationResponseJSON

const registerChallenge = {
  purpose: 'register',
  challenge: 'defi',
  userId: member.id,
  expiresAt: now.getTime() + 60_000,
} as const

const signInChallenge = {
  ...registerChallenge,
  purpose: 'signin',
  userId: '',
} as const

function authentication(userHandle?: string): AuthenticationResponseJSON {
  return {
    id: 'Y3JlZA',
    rawId: 'Y3JlZA',
    type: 'public-key',
    clientExtensionResults: {},
    response: {
      clientDataJSON: 'e30',
      authenticatorData: 'AA',
      signature: 'AA',
      userHandle,
    },
  }
}

describe('ajout d’une clé d’accès', () => {
  it('prépare un défi lié au membre et exclut ses clés existantes', async () => {
    const result = await beginPasskeyRegistration(
      rp,
      dependencies({ listPasskeys: async () => [stored()] }),
    )

    expect(result).toMatchObject({
      ok: true,
      challenge: { purpose: 'register', userId: member.id },
      options: {
        rp: { id: 'localhost', name: 'Smodeal' },
        excludeCredentials: [{ id: 'Y3JlZA' }],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      },
    })
  })

  it('refuse un visiteur déconnecté ou un membre suspendu', async () => {
    expect(
      await beginPasskeyRegistration(
        rp,
        dependencies({ loadMember: async () => null }),
      ),
    ).toMatchObject({ ok: false })
    expect(
      await beginPasskeyRegistration(
        rp,
        dependencies({
          loadMember: async () => ({ ...member, suspended: true }),
        }),
      ),
    ).toMatchObject({ ok: false })
  })

  it('refuse une onzième clé d’accès', async () => {
    const full = Array.from({ length: 10 }, (_, index) =>
      stored({ rowId: `cle-${index}`, credentialId: `id${index}` }),
    )

    expect(
      await beginPasskeyRegistration(
        rp,
        dependencies({ listPasskeys: async () => full }),
      ),
    ).toEqual({
      ok: false,
      message: 'Vous avez atteint la limite de 10 clés d’accès.',
    })
  })

  it('enregistre la clé vérifiée avec sa clé publique et ses transports connus', async () => {
    const deps = dependencies()

    expect(
      await completePasskeyRegistration(
        rp,
        registration,
        registerChallenge,
        deps,
      ),
    ).toEqual({ ok: true })
    expect(deps.verifyRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'defi',
        expectedOrigin: rp.origin,
        expectedRPID: rp.id,
        requireUserVerification: true,
      }),
    )
    expect(deps.savePasskey).toHaveBeenCalledWith({
      userId: member.id,
      credentialId: 'bm91dmVsbGU',
      publicKey: 'AQID',
      counter: 0,
      transports: ['internal'],
    })
  })

  it('refuse un défi absent ou émis pour un autre membre', async () => {
    const deps = dependencies()

    expect(
      await completePasskeyRegistration(rp, registration, null, deps),
    ).toMatchObject({ ok: false })
    expect(
      await completePasskeyRegistration(
        rp,
        registration,
        { ...registerChallenge, userId: 'membre-2' },
        deps,
      ),
    ).toMatchObject({ ok: false })
    expect(deps.savePasskey).not.toHaveBeenCalled()
  })

  it('n’enregistre rien quand la vérification échoue', async () => {
    const deps = dependencies({
      verifyRegistration: vi.fn(async () => {
        throw new Error('origine inattendue')
      }) as unknown as PasskeyDependencies['verifyRegistration'],
    })

    expect(
      await completePasskeyRegistration(
        rp,
        registration,
        registerChallenge,
        deps,
      ),
    ).toMatchObject({ ok: false })
    expect(deps.savePasskey).not.toHaveBeenCalled()
  })

  it('refuse une clé déjà enregistrée', async () => {
    const deps = dependencies({ findPasskey: async () => stored() })

    expect(
      await completePasskeyRegistration(
        rp,
        registration,
        registerChallenge,
        deps,
      ),
    ).toEqual({ ok: false, message: 'Cette clé d’accès est déjà enregistrée.' })
    expect(deps.savePasskey).not.toHaveBeenCalled()
  })
})

describe('gestion des clés d’accès', () => {
  it('liste les clés du membre sans exposer la clé publique', async () => {
    expect(
      await listMemberPasskeys(
        dependencies({ listPasskeys: async () => [stored()] }),
      ),
    ).toEqual({
      ok: true,
      passkeys: [
        {
          id: 'cle-1',
          createdAt: '2026-10-01T10:00:00.000Z',
          lastUsedAt: null,
        },
      ],
    })
  })

  it('supprime uniquement une clé du membre connecté', async () => {
    const own = dependencies({ findPasskeyByRowId: async () => stored() })
    const other = dependencies({
      findPasskeyByRowId: async () => stored({ userId: 'membre-2' }),
    })

    expect(await removeMemberPasskey('cle-1', own)).toEqual({ ok: true })
    expect(own.deletePasskey).toHaveBeenCalledWith('cle-1')
    expect(await removeMemberPasskey('cle-1', other)).toMatchObject({
      ok: false,
    })
    expect(other.deletePasskey).not.toHaveBeenCalled()
  })
})

describe('connexion par clé d’accès', () => {
  it('prépare un défi sans identifier le visiteur', async () => {
    const result = await beginPasskeySignIn(rp)

    expect(result.challenge).toEqual({
      purpose: 'signin',
      challenge: result.options.challenge,
      userId: '',
    })
    expect(result.options).toMatchObject({
      rpId: 'localhost',
      userVerification: 'required',
    })
  })

  it('ouvre une session et met à jour le compteur après vérification', async () => {
    const deps = dependencies({ findPasskey: async () => stored() })

    expect(
      await completePasskeySignIn(
        rp,
        authentication(Buffer.from(member.id).toString('base64url')),
        signInChallenge,
        deps,
      ),
    ).toEqual({ ok: true, session: 'session-membre-1' })
    expect(deps.verifyAuthentication).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'defi',
        credential: expect.objectContaining({ id: 'Y3JlZA', counter: 3 }),
        requireUserVerification: true,
      }),
    )
    expect(deps.recordUse).toHaveBeenCalledWith('cle-1', 4, now)
  })

  it('refuse une clé inconnue, un défi absent ou un identifiant de membre incohérent', async () => {
    const deps = dependencies({ findPasskey: async () => stored() })

    expect(
      await completePasskeySignIn(
        rp,
        authentication(),
        signInChallenge,
        dependencies(),
      ),
    ).toMatchObject({ ok: false })
    expect(
      await completePasskeySignIn(rp, authentication(), null, deps),
    ).toMatchObject({ ok: false })
    expect(
      await completePasskeySignIn(
        rp,
        authentication(Buffer.from('membre-2').toString('base64url')),
        signInChallenge,
        deps,
      ),
    ).toMatchObject({ ok: false })
    expect(deps.recordUse).not.toHaveBeenCalled()
  })

  it('refuse une signature invalide ou un compte suspendu', async () => {
    const invalid = dependencies({
      findPasskey: async () => stored(),
      verifyAuthentication: vi.fn(async () => {
        throw new Error('signature invalide')
      }) as unknown as PasskeyDependencies['verifyAuthentication'],
    })
    const suspended = dependencies({
      findPasskey: async () => stored(),
      isActiveMember: async () => false,
    })

    expect(
      await completePasskeySignIn(
        rp,
        authentication(),
        signInChallenge,
        invalid,
      ),
    ).toMatchObject({ ok: false })
    expect(
      await completePasskeySignIn(
        rp,
        authentication(),
        signInChallenge,
        suspended,
      ),
    ).toMatchObject({ ok: false })
    expect(suspended.recordUse).not.toHaveBeenCalled()
  })
})
