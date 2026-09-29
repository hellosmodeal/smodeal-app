import { AppwriteException } from 'node-appwrite'
import { describe, expect, it } from 'vitest'
import { loadCurrentUser } from './session.server'

describe('chargement de la session active', () => {
  it.each([
    [401, 'user_unauthorized'],
    [403, 'user_blocked'],
  ])(
    'refuse la session Appwrite %s/%s sans erreur serveur',
    async (code, type) => {
      await expect(
        loadCurrentUser({
          get: async () => {
            throw new AppwriteException(
              'Session fictive refusée',
              Number(code),
              String(type),
            )
          },
        }),
      ).resolves.toBeNull()
    },
  )
  it('conserve les erreurs de permission du service qui ne sont pas une suspension', async () => {
    const error = new AppwriteException(
      'Permission de service fictive',
      403,
      'general_unauthorized_scope',
    )
    await expect(
      loadCurrentUser({
        get: async () => {
          throw error
        },
      }),
    ).rejects.toBe(error)
  })
  it('retourne une session anonyme si aucun compte de session ne peut être chargé', async () => {
    await expect(loadCurrentUser(null)).resolves.toBeNull()
  })
})
