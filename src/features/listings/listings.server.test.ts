import { describe, expect, it, vi } from 'vitest'

import {
  changeListingStatus,
  getListingForEditing,
  getSellerListings,
  type ListingDependencies,
  type PublishListingInput,
  publishListing,
  renewListing,
  updateListing,
} from './listings.server'

const editInput = {
  title: 'Lampe révisée',
  description: 'Une lampe révisée en très bon état.',
  categorySlug: 'maison' as const,
  condition: 'like_new' as const,
  priceCents: 3000,
  city: 'Villeurbanne',
  postalCode: '69100',
  department: '69',
}

const input: PublishListingInput = {
  title: 'Lampe de bureau',
  description: 'Une lampe en très bon état.',
  categorySlug: 'maison',
  condition: 'good',
  priceCents: 2500,
  city: 'Lyon',
  postalCode: '69001',
  department: '69',
  phone: '0600000000',
  displayConsent: true,
  photos: [
    {
      name: 'lampe.png',
      type: 'image/png',
      size: 8,
      arrayBuffer: async () =>
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer,
    },
  ],
}

function dependencies(
  overrides: Partial<ListingDependencies> = {},
): ListingDependencies {
  let index = 0
  return {
    getUser: vi.fn(async () => ({ $id: 'seller-1', emailVerification: true })),
    databaseId: 'smodeal',
    createId: () => `id-${++index}`,
    storage: {
      createFile: vi.fn(async ({ fileId }: { fileId: string }) => ({
        $id: fileId,
      })),
      deleteFile: vi.fn(async () => ({})),
    },
    tables: {
      createRow: vi.fn(async ({ rowId }: { rowId: string }) => ({
        $id: rowId,
      })),
      updateRow: vi.fn(async () => ({}) as never),
      getRow: vi.fn(async () => ({
        $id: 'listing-1',
        ownerId: 'seller-1',
        status: 'active',
        expiresAt: '2026-12-01T00:00:00.000Z',
      })) as never,
      listRows: vi.fn(async () => ({ rows: [] })),
      createTransaction: vi.fn(async () => ({ $id: 'transaction-1' })),
      updateTransaction: vi.fn(async () => ({})),
    },
    ...overrides,
  }
}

describe('publishListing', () => {
  it('refuse une photo déguisée avant tout envoi au stockage', async () => {
    const deps = dependencies()
    await expect(
      publishListing(
        {
          ...input,
          photos: [
            {
              ...input.photos[0],
              name: 'faux.png',
              size: 10,
              type: 'image/png',
              arrayBuffer: async () =>
                new TextEncoder().encode('<html>faux').buffer,
            },
          ],
        },
        new Date(),
        deps,
      ),
    ).rejects.toThrow('contenu de la photo')
    expect(deps.storage.createFile).not.toHaveBeenCalled()
    expect(deps.tables.createRow).not.toHaveBeenCalled()
  })

  it('préserve les photos si le résultat du commit est inconnu', async () => {
    const deps = dependencies()
    deps.tables.updateTransaction = vi.fn(async () => {
      throw new Error('Réponse perdue')
    })
    await expect(publishListing(input, new Date(), deps)).rejects.toThrow(
      'Réponse perdue',
    )
    expect(deps.storage.deleteFile).not.toHaveBeenCalled()
  })
  it('refuse la publication avec une adresse email non vérifiée', async () => {
    const deps = dependencies({
      getUser: vi.fn(async () => ({
        $id: 'seller-1',
        emailVerification: false,
      })),
    })

    await expect(publishListing(input, new Date(), deps)).rejects.toThrow(
      'Vérifiez votre adresse email',
    )
    expect(deps.tables.createRow).not.toHaveBeenCalled()
  })

  it('enregistre le propriétaire dérivé de la session et le contact séparément', async () => {
    const deps = dependencies()

    await publishListing(input, new Date('2026-10-01T00:00:00.000Z'), deps)

    expect(deps.tables.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'contacts',
        data: expect.objectContaining({
          userId: 'seller-1',
          phone: '0600000000',
        }),
      }),
    )
    expect(deps.tables.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'listings',
        data: expect.objectContaining({
          ownerId: 'seller-1',
          photoIds: ['id-1'],
          expiresAt: '2026-11-30T00:00:00.000Z',
        }),
      }),
    )
  })

  it('conserve l’accord d’affichage existant quand le formulaire le renvoie', async () => {
    const deps = dependencies()
    deps.tables.listRows = vi.fn(async () => ({ rows: [{ $id: 'contact-1' }] }))

    await publishListing(input, new Date(), deps)

    expect(deps.tables.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'contacts',
        rowId: 'contact-1',
        data: { userId: 'seller-1', phone: '0600000000', displayConsent: true },
      }),
    )
  })

  it('retire l’accord pour toutes les annonces quand il est décoché à la publication', async () => {
    const deps = dependencies()
    deps.tables.listRows = vi.fn(async () => ({ rows: [{ $id: 'contact-1' }] }))

    await publishListing({ ...input, displayConsent: false }, new Date(), deps)

    expect(deps.tables.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'contacts',
        rowId: 'contact-1',
        data: expect.objectContaining({ displayConsent: false }),
      }),
    )
  })

  it('supprime les photos déjà envoyées si la création de l’annonce échoue', async () => {
    const tables = dependencies().tables
    tables.createRow = vi.fn(async ({ tableId }: { tableId: string }) => {
      if (tableId === 'listings') throw new Error('Appwrite indisponible')
      return { $id: 'contact-1' }
    })
    const deps = dependencies({ tables })

    await expect(publishListing(input, new Date(), deps)).rejects.toThrow(
      'Appwrite indisponible',
    )
    expect(deps.storage.deleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ bucketId: 'listing-photos', fileId: 'id-1' }),
    )
  })
})

describe('changeListingStatus', () => {
  it('refuse de modifier une annonce retirée par modération', async () => {
    const deps = dependencies()
    deps.tables.getRow = vi.fn(async () => ({
      $id: 'listing-1',
      ownerId: 'seller-1',
      status: 'removed_by_moderation',
      expiresAt: '2026-12-01T00:00:00Z',
    })) as never
    await expect(
      changeListingStatus('listing-1', 'sold', new Date(), deps),
    ).rejects.toThrow('ne peut pas être modifiée')
    expect(deps.tables.updateRow).not.toHaveBeenCalled()
    expect(deps.tables.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction-1',
      rollback: true,
    })
  })
  it('refuse à un autre membre de modifier une annonce', async () => {
    const deps = dependencies({
      getUser: vi.fn(async () => ({
        $id: 'seller-2',
        emailVerification: true,
      })),
    })

    await expect(
      changeListingStatus('listing-1', 'sold', new Date(), deps),
    ).rejects.toThrow('Cette annonce ne peut pas être modifiée.')
    expect(deps.tables.updateRow).not.toHaveBeenCalled()
  })
})

describe('renewListing', () => {
  it('refuse de republier avec une adresse email non vérifiée', async () => {
    const deps = dependencies({
      getUser: vi.fn(async () => ({
        $id: 'seller-1',
        emailVerification: false,
      })),
    })
    deps.tables.getRow = vi.fn(async () => ({
      $id: 'listing-1',
      ownerId: 'seller-1',
      status: 'expired',
      expiresAt: '2026-09-01T00:00:00Z',
    })) as never
    await expect(
      renewListing('listing-1', new Date('2026-10-01T00:00:00Z'), deps),
    ).rejects.toThrow('Vérifiez votre adresse email')
    expect(deps.tables.updateRow).not.toHaveBeenCalled()
  })

  it('republie sa propre annonce expirée pour 60 jours', async () => {
    const deps = dependencies()
    deps.tables.getRow = vi.fn(async () => ({
      $id: 'listing-1',
      ownerId: 'seller-1',
      status: 'expired',
      expiresAt: '2026-09-01T00:00:00Z',
    })) as never
    await renewListing('listing-1', new Date('2026-10-01T00:00:00Z'), deps)
    expect(deps.tables.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: 'active',
          publishedAt: '2026-10-01T00:00:00.000Z',
          expiresAt: '2026-11-30T00:00:00.000Z',
          soldAt: null,
        },
        transactionId: 'transaction-1',
      }),
    )
  })
})

describe('getSellerListings', () => {
  it('pagine la gestion vendeur sans inclure les contacts privés', async () => {
    const deps = dependencies()
    deps.tables.listRows = vi.fn(async () => ({
      rows: Array.from({ length: 26 }, (_, i) => ({
        $id: `listing-${i}`,
        title: 'Lampe',
        phone: '0600000000',
      })),
    }))
    const result = await getSellerListings(undefined, deps)
    expect(result.items).toHaveLength(25)
    expect(result.nextCursor).toBe('listing-24')
    expect(result.items[0]).not.toHaveProperty('phone')
  })
})

describe('getListingForEditing', () => {
  it('retourne seulement les données publiques de sa propre annonce', async () => {
    const deps = dependencies()
    deps.tables.getRow = vi.fn(async () => ({
      $id: 'listing-1',
      ownerId: 'seller-1',
      status: 'active',
      expiresAt: '2026-12-01T00:00:00.000Z',
      ...editInput,
      photoIds: ['photo-1'],
      publishedAt: '2026-10-01T00:00:00.000Z',
    })) as never

    await expect(getListingForEditing('listing-1', deps)).resolves.toEqual({
      id: 'listing-1',
      ...editInput,
    })
  })
})

describe('updateListing', () => {
  it('met à jour les champs publics sans modifier le statut ni les dates', async () => {
    const deps = dependencies()

    await updateListing('listing-1', editInput, deps)

    expect(deps.tables.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        data: editInput,
        transactionId: 'transaction-1',
      }),
    )
  })

  it('refuse la sauvegarde avec une adresse email non vérifiée', async () => {
    const deps = dependencies({
      getUser: vi.fn(async () => ({
        $id: 'seller-1',
        emailVerification: false,
      })),
    })

    await expect(updateListing('listing-1', editInput, deps)).rejects.toThrow(
      'Vérifiez votre adresse email',
    )
    expect(deps.tables.createTransaction).not.toHaveBeenCalled()
  })

  it('refuse la sauvegarde d’une annonce retirée par modération', async () => {
    const deps = dependencies()
    deps.tables.getRow = vi.fn(async () => ({
      $id: 'listing-1',
      ownerId: 'seller-1',
      status: 'removed_by_moderation',
      expiresAt: '2026-12-01T00:00:00.000Z',
    })) as never

    await expect(updateListing('listing-1', editInput, deps)).rejects.toThrow(
      'ne peut pas être modifiée',
    )
    expect(deps.tables.updateRow).not.toHaveBeenCalled()
  })
})
