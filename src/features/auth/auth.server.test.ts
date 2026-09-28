import { describe, expect, it, vi } from 'vitest'

import {
  completeEmailVerification,
  completePasswordRecovery,
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
