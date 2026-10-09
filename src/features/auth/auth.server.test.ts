import { describe, expect, it, vi } from 'vitest'

import {
  completeEmailVerification,
  completePasswordRecovery,
  registerAndSendVerification,
  requestPasswordRecovery,
  sendEmailVerification,
} from './auth.server'

describe('sendEmailVerification', () => {
  it('demande au compte courant un lien de vérification sur l’origine configurée', async () => {
    const createEmailVerification = vi.fn().mockResolvedValue({})

    await sendEmailVerification(
      { createEmailVerification },
      'https://smodeal.fr',
    )

    expect(createEmailVerification).toHaveBeenCalledWith({
      url: 'https://smodeal.fr/verification-email',
    })
  })
})

describe('requestPasswordRecovery', () => {
  it('demande un lien de réinitialisation sans exposer son résultat à l’appelant', async () => {
    const createRecovery = vi.fn().mockRejectedValue(new Error('inconnu'))

    await expect(
      requestPasswordRecovery(
        { createRecovery },
        'personne@example.test',
        'https://smodeal.fr',
      ),
    ).resolves.toEqual({ ok: true })

    expect(createRecovery).toHaveBeenCalledWith({
      email: 'personne@example.test',
      url: 'https://smodeal.fr/reinitialiser-mot-de-passe',
    })
  })
})

describe('completeEmailVerification', () => {
  it('transmet le jeton de vérification au SDK Appwrite', async () => {
    const updateEmailVerification = vi.fn().mockResolvedValue({})

    await completeEmailVerification(
      { updateEmailVerification },
      'user_123',
      'secret',
    )

    expect(updateEmailVerification).toHaveBeenCalledWith({
      userId: 'user_123',
      secret: 'secret',
    })
  })
})

describe('completePasswordRecovery', () => {
  it('transmet le nouveau mot de passe uniquement au SDK Appwrite', async () => {
    const updateRecovery = vi.fn().mockResolvedValue({})

    await completePasswordRecovery(
      { updateRecovery },
      'user_123',
      'secret',
      'mot-de-passe-solide',
    )

    expect(updateRecovery).toHaveBeenCalledWith({
      userId: 'user_123',
      secret: 'secret',
      password: 'mot-de-passe-solide',
    })
  })
})

describe('registerAndSendVerification', () => {
  const data = {
    name: 'Camille',
    email: 'camille@example.test',
    password: 'mot-de-passe-solide',
  }
  const session = {
    userId: 'user-1',
    secret: 'session-secret',
    expire: '2027-01-01T00:00:00Z',
  }

  function accounts(createEmailVerification = vi.fn().mockResolvedValue({})) {
    const account = {
      create: vi.fn().mockResolvedValue({}),
      createEmailPasswordSession: vi.fn().mockResolvedValue(session),
    }
    const sessionAccount = vi.fn().mockReturnValue({ createEmailVerification })
    return { account, sessionAccount, createEmailVerification }
  }

  it('envoie le lien de vérification avec la session du nouveau compte', async () => {
    const { account, sessionAccount, createEmailVerification } = accounts()

    const result = await registerAndSendVerification(
      account,
      sessionAccount,
      data,
      'https://smodeal.fr',
    )

    expect(result).toEqual({ session, verificationSent: true })
    expect(sessionAccount).toHaveBeenCalledWith('session-secret')
    expect(createEmailVerification).toHaveBeenCalledWith({
      url: 'https://smodeal.fr/verification-email',
    })
  })

  it('crée le profil public avec le pseudonyme choisi à l’inscription', async () => {
    const { account, sessionAccount } = accounts()
    const createProfile = vi.fn().mockResolvedValue(undefined)

    await registerAndSendVerification(
      account,
      sessionAccount,
      data,
      'https://smodeal.fr',
      createProfile,
    )

    expect(createProfile).toHaveBeenCalledWith('user-1', 'Camille')
  })

  it('termine l’inscription même si le profil public ne peut pas être créé', async () => {
    const { account, sessionAccount } = accounts()

    await expect(
      registerAndSendVerification(
        account,
        sessionAccount,
        data,
        'https://smodeal.fr',
        vi.fn().mockRejectedValue(new Error('table indisponible')),
      ),
    ).resolves.toEqual({ session, verificationSent: true })
  })

  it('crée le compte même si l’envoi du lien échoue', async () => {
    const { account, sessionAccount } = accounts(
      vi.fn().mockRejectedValue(new Error('smtp indisponible')),
    )

    await expect(
      registerAndSendVerification(
        account,
        sessionAccount,
        data,
        'https://smodeal.fr',
      ),
    ).resolves.toEqual({ session, verificationSent: false })
  })

  it('signale un envoi impossible sans origine publique configurée', async () => {
    const { account, sessionAccount, createEmailVerification } = accounts()

    await expect(
      registerAndSendVerification(account, sessionAccount, data, undefined),
    ).resolves.toEqual({ session, verificationSent: false })
    expect(createEmailVerification).not.toHaveBeenCalled()
  })

  it('n’envoie rien si la création du compte échoue', async () => {
    const { account, sessionAccount } = accounts()
    account.create.mockRejectedValue(new Error('conflit'))

    await expect(
      registerAndSendVerification(
        account,
        sessionAccount,
        data,
        'https://smodeal.fr',
      ),
    ).rejects.toThrow('conflit')
    expect(sessionAccount).not.toHaveBeenCalled()
  })
})
