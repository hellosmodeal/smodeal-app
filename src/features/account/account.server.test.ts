import { describe, expect, it, vi } from 'vitest'
import {
  type AccountDependencies,
  loadAccountSettings,
  savePrivateContact,
  savePublicProfile,
} from './account.server'

function dependencies(
  overrides: Partial<AccountDependencies> = {},
): AccountDependencies {
  return {
    loadMember: async () => ({
      id: 'member-1',
      name: 'Nom inscription',
      suspended: false,
    }),
    findProfile: async () => ({ pseudonym: 'Lina B.' }),
    saveProfile: vi.fn(async () => undefined),
    renameAccount: vi.fn(async () => undefined),
    findContact: async () => ({ phone: '0612345678', displayConsent: true }),
    saveContact: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('loadAccountSettings', () => {
  it('renvoie le pseudonyme et les coordonnées du membre connecté', async () => {
    await expect(loadAccountSettings(dependencies())).resolves.toEqual({
      ok: true,
      pseudonym: 'Lina B.',
      contact: { phone: '0612345678', displayConsent: true },
    })
  })

  it('reprend le nom d’inscription quand aucun profil public n’existe', async () => {
    await expect(
      loadAccountSettings(
        dependencies({
          findProfile: async () => null,
          findContact: async () => null,
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      pseudonym: 'Nom inscription',
      contact: null,
    })
  })

  it('ne lit rien pour un visiteur non connecté', async () => {
    const findContact = vi.fn()
    await expect(
      loadAccountSettings(
        dependencies({ loadMember: async () => null, findContact }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: 'Connectez-vous pour gérer votre compte.',
    })
    expect(findContact).not.toHaveBeenCalled()
  })
})

describe('savePublicProfile', () => {
  it('enregistre le pseudonyme pour l’identité de la session', async () => {
    const deps = dependencies()
    await expect(
      savePublicProfile({ pseudonym: 'Lina B.' }, deps),
    ).resolves.toEqual({ ok: true, pseudonym: 'Lina B.' })
    expect(deps.saveProfile).toHaveBeenCalledWith('member-1', 'Lina B.')
    expect(deps.renameAccount).toHaveBeenCalledWith('member-1', 'Lina B.')
  })

  it('refuse un membre suspendu sans rien écrire', async () => {
    const deps = dependencies({
      loadMember: async () => ({ id: 'member-1', name: 'X', suspended: true }),
    })
    await expect(
      savePublicProfile({ pseudonym: 'Lina B.' }, deps),
    ).resolves.toEqual({
      ok: false,
      message: 'Votre compte ne permet pas cette modification.',
    })
    expect(deps.saveProfile).not.toHaveBeenCalled()
    expect(deps.renameAccount).not.toHaveBeenCalled()
  })

  it('refuse un visiteur non connecté sans rien écrire', async () => {
    const deps = dependencies({ loadMember: async () => null })
    await expect(
      savePublicProfile({ pseudonym: 'Lina B.' }, deps),
    ).resolves.toEqual({
      ok: false,
      message: 'Connectez-vous pour gérer votre compte.',
    })
    expect(deps.saveProfile).not.toHaveBeenCalled()
  })
})

describe('savePrivateContact', () => {
  it('enregistre le numéro et le consentement sans renvoyer le numéro', async () => {
    const deps = dependencies()
    const result = await savePrivateContact(
      { phone: '0698765432', displayConsent: false },
      deps,
    )
    expect(result).toEqual({ ok: true })
    expect(deps.saveContact).toHaveBeenCalledWith('member-1', {
      phone: '0698765432',
      displayConsent: false,
    })
  })

  it('refuse un membre suspendu sans rien écrire', async () => {
    const deps = dependencies({
      loadMember: async () => ({ id: 'member-1', name: 'X', suspended: true }),
    })
    await expect(
      savePrivateContact({ phone: '0698765432', displayConsent: true }, deps),
    ).resolves.toEqual({
      ok: false,
      message: 'Votre compte ne permet pas cette modification.',
    })
    expect(deps.saveContact).not.toHaveBeenCalled()
  })
})
