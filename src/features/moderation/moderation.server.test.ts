import { Client, Query, TablesDB, Users } from 'node-appwrite'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listOpenReports,
  moderationActionResult,
  removeReportedListing,
  reportErrorResult,
  submitListingReport,
  suspendReportedSeller,
} from './moderation.server'

const now = new Date('2026-10-01T12:00:00Z')
const seller = { id: 'seller', labels: [] }
const admin = { id: 'admin', labels: ['admin'] }
const listing = {
  $id: 'listing',
  ownerId: 'seller',
  status: 'active',
  expiresAt: '2026-11-01T00:00:00Z',
}

describe('signalement et retrait administratif', () => {
  let db: TablesDB
  beforeEach(() => {
    db = new TablesDB(new Client())
    vi.spyOn(db, 'getRow').mockResolvedValue(listing as never)
    vi.spyOn(db, 'createRow').mockResolvedValue({ $id: 'report' } as never)
    vi.spyOn(db, 'createTransaction').mockResolvedValue({
      $id: 'transaction',
    } as never)
    vi.spyOn(db, 'updateTransaction').mockResolvedValue({
      $id: 'transaction',
    } as never)
    vi.spyOn(db, 'updateRow').mockResolvedValue({} as never)
  })

  it('refuse le signalement anonyme sans lire les données', async () => {
    await expect(
      submitListingReport(
        db,
        'smodeal',
        null,
        { listingId: 'listing', reason: 'Annonce trompeuse' },
        now,
      ),
    ).rejects.toThrow('Connectez-vous')
    expect(db.getRow).not.toHaveBeenCalled()
  })
  it('enregistre le signalement au nom de la session', async () => {
    await submitListingReport(
      db,
      'smodeal',
      { id: 'buyer', labels: [] },
      { listingId: 'listing', reason: 'Annonce trompeuse' },
      now,
    )
    expect(db.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'reports',
        data: {
          listingId: 'listing',
          reporterId: 'buyer',
          reason: 'Annonce trompeuse',
          state: 'open',
        },
      }),
    )
  })
  it('refuse de signaler sa propre annonce', async () => {
    await expect(
      submitListingReport(
        db,
        'smodeal',
        seller,
        { listingId: 'listing', reason: 'Annonce trompeuse' },
        now,
      ),
    ).rejects.toThrow('propre annonce')
    expect(db.createRow).not.toHaveBeenCalled()
  })
  it('refuse une annonce expirée même si son statut est actif', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      ...listing,
      expiresAt: now.toISOString(),
    } as never)
    await expect(
      submitListingReport(
        db,
        'smodeal',
        { id: 'buyer', labels: [] },
        { listingId: 'listing', reason: 'Annonce trompeuse' },
        now,
      ),
    ).rejects.toThrow('indisponible')
  })
  it('refuse le retrait par un membre sans rôle administrateur', async () => {
    await expect(
      removeReportedListing(
        db,
        'smodeal',
        seller,
        { reportId: 'report', reason: 'Annonce interdite' },
        now,
      ),
    ).rejects.toThrow('administrateurs')
    expect(db.getRow).not.toHaveBeenCalled()
  })
  it('retire une annonce et clôt le signalement avec journal dans une transaction', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      $id: 'report',
      listingId: 'listing',
      state: 'open',
    } as never)
    await removeReportedListing(
      db,
      'smodeal',
      admin,
      { reportId: 'report', reason: 'Annonce interdite' },
      now,
    )
    expect(db.getRow).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: 'transaction' }),
    )
    expect(db.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'listings',
        rowId: 'listing',
        data: { status: 'removed_by_moderation' },
        transactionId: 'transaction',
      }),
    )
    expect(db.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'reports',
        data: { state: 'resolved', resolvedAt: now.toISOString() },
        transactionId: 'transaction',
      }),
    )
    expect(db.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'moderation_logs',
        data: {
          adminId: 'admin',
          targetType: 'listing',
          targetId: 'listing',
          action: 'remove_listing',
          reason: 'Annonce interdite',
        },
        transactionId: 'transaction',
      }),
    )
    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction',
      commit: true,
    })
  })
  it('annule le retrait si le journal ne peut être écrit', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      $id: 'report',
      listingId: 'listing',
      state: 'open',
    } as never)
    vi.mocked(db.createRow).mockRejectedValue(new Error('service indisponible'))
    await expect(
      removeReportedListing(
        db,
        'smodeal',
        admin,
        { reportId: 'report', reason: 'Annonce interdite' },
        now,
      ),
    ).rejects.toThrow('service indisponible')
    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction',
      rollback: true,
    })
    expect(db.updateTransaction).not.toHaveBeenCalledWith(
      expect.objectContaining({ commit: true }),
    )
  })
  it('ne modifie pas un signalement déjà traité', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      $id: 'report',
      listingId: 'listing',
      state: 'resolved',
    } as never)
    await expect(
      removeReportedListing(
        db,
        'smodeal',
        admin,
        { reportId: 'report', reason: 'Annonce interdite' },
        now,
      ),
    ).rejects.toThrow('déjà traité')
    expect(db.updateRow).not.toHaveBeenCalled()
  })

  it('classe un signalement sans retirer une annonce légitime', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      $id: 'report',
      listingId: 'listing',
      state: 'open',
    } as never)
    await removeReportedListing(
      db,
      'smodeal',
      admin,
      { reportId: 'report', reason: 'Annonce conforme', action: 'dismiss' },
      now,
    )
    expect(db.updateRow).not.toHaveBeenCalledWith(
      expect.objectContaining({ tableId: 'listings' }),
    )
    expect(db.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'reports',
        data: { state: 'dismissed', resolvedAt: now.toISOString() },
      }),
    )
    expect(db.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'moderation_logs',
        data: expect.objectContaining({ action: 'dismiss_report' }),
      }),
    )
  })

  it('réserve la liste des signalements aux administrateurs', async () => {
    const list = vi.spyOn(db, 'listRows')
    await expect(listOpenReports(db, 'smodeal', seller)).rejects.toThrow(
      'administrateurs',
    )
    expect(list).not.toHaveBeenCalled()
  })

  it('pagine les signalements avec l’annonce concernée sans exposer le déclarant', async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({
      $id: `report-${i}`,
      listingId: i === 1 ? 'listing-retiree' : 'listing',
      reason: 'Annonce trompeuse',
      $createdAt: now.toISOString(),
      reporterId: 'private-user',
    }))
    vi.spyOn(db, 'listRows').mockImplementation((async (params: {
      tableId: string
    }) =>
      params.tableId === 'reports'
        ? { rows, total: 26 }
        : {
            rows: [
              { ...listing, title: 'Vélo de ville' },
              {
                ...listing,
                $id: 'listing-retiree',
                title: 'Console de jeux',
                status: 'removed_by_moderation',
              },
            ],
            total: 2,
          }) as never)
    const result = await listOpenReports(db, 'smodeal', admin, undefined, now)
    expect(result.reports).toHaveLength(25)
    expect(result.hasMore).toBe(true)
    expect(result.reports[0]).toEqual({
      id: 'report-0',
      listingId: 'listing',
      reason: 'Annonce trompeuse',
      createdAt: now.toISOString(),
      listing: {
        title: 'Vélo de ville',
        status: 'active',
        publiclyVisible: true,
      },
    })
    expect(result.reports[1].listing).toEqual({
      title: 'Console de jeux',
      status: 'removed_by_moderation',
      publiclyVisible: false,
    })
    expect(db.listRows).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'listings',
        queries: expect.arrayContaining([
          Query.equal('$id', ['listing', 'listing-retiree']),
        ]),
      }),
    )
  })

  it('signale une annonce supprimée sans casser la liste', async () => {
    vi.spyOn(db, 'listRows').mockImplementation((async (params: {
      tableId: string
    }) =>
      params.tableId === 'reports'
        ? {
            rows: [
              {
                $id: 'report',
                listingId: 'disparue',
                reason: 'Annonce trompeuse',
                $createdAt: now.toISOString(),
              },
            ],
            total: 1,
          }
        : { rows: [], total: 0 }) as never)
    const result = await listOpenReports(db, 'smodeal', admin, undefined, now)
    expect(result.reports[0].listing).toBeNull()
  })

  it('ne lit aucune annonce quand il n’y a aucun signalement', async () => {
    const list = vi
      .spyOn(db, 'listRows')
      .mockResolvedValue({ rows: [], total: 0 } as never)
    const result = await listOpenReports(db, 'smodeal', admin, undefined, now)
    expect(result).toEqual({ reports: [], hasMore: false })
    expect(list).toHaveBeenCalledTimes(1)
  })

  it('traduit une erreur de modération en résultat affichable', () => {
    expect(moderationActionResult(new Error('secret interne'))).toEqual({
      ok: false,
      code: 'unavailable',
      message:
        'Action impossible. Rechargez pour vérifier l’état du signalement.',
    })
  })

  it('masque les messages internes du service de données', () => {
    expect(reportErrorResult(new Error('secret interne'))).toEqual({
      ok: false,
      message: 'Signalement impossible pour le moment.',
    })
  })
})

describe('suspension d’un vendeur signalé', () => {
  let db: TablesDB
  let users: Users
  const input = { reportId: 'report', reason: 'Escroqueries répétées' }
  beforeEach(() => {
    db = new TablesDB(new Client())
    users = new Users(new Client())
    vi.spyOn(db, 'getRow').mockImplementation((async (params: {
      tableId: string
    }) =>
      params.tableId === 'reports'
        ? { $id: 'report', listingId: 'listing', state: 'open' }
        : listing) as never)
    vi.spyOn(db, 'createRow').mockResolvedValue({} as never)
    vi.spyOn(db, 'updateRow').mockResolvedValue({} as never)
    vi.spyOn(db, 'updateRows').mockResolvedValue({} as never)
    vi.spyOn(db, 'createTransaction').mockResolvedValue({
      $id: 'transaction',
    } as never)
    vi.spyOn(db, 'updateTransaction').mockResolvedValue({} as never)
    vi.spyOn(users, 'get').mockResolvedValue({
      $id: 'seller',
      labels: [],
    } as never)
    vi.spyOn(users, 'updateStatus').mockResolvedValue({} as never)
    vi.spyOn(users, 'deleteSessions').mockResolvedValue({} as never)
  })

  it('refuse la suspension par un membre sans rôle administrateur', async () => {
    await expect(
      suspendReportedSeller(db, users, 'smodeal', seller, input, now),
    ).rejects.toThrow('administrateurs')
    expect(db.getRow).not.toHaveBeenCalled()
    expect(users.updateStatus).not.toHaveBeenCalled()
  })

  it('bloque le vendeur, ferme ses sessions et retire ses annonces avec journal', async () => {
    await suspendReportedSeller(db, users, 'smodeal', admin, input, now)
    expect(users.updateStatus).toHaveBeenCalledWith({
      userId: 'seller',
      status: false,
    })
    expect(users.deleteSessions).toHaveBeenCalledWith({ userId: 'seller' })
    expect(db.updateRows).toHaveBeenCalledWith({
      databaseId: 'smodeal',
      tableId: 'listings',
      data: { status: 'removed_by_moderation' },
      queries: [
        Query.equal('ownerId', 'seller'),
        Query.equal('status', ['active', 'expired']),
      ],
      transactionId: 'transaction',
    })
    expect(db.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'reports',
        rowId: 'report',
        data: { state: 'resolved', resolvedAt: now.toISOString() },
        transactionId: 'transaction',
      }),
    )
    expect(db.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'moderation_logs',
        data: {
          adminId: 'admin',
          targetType: 'user',
          targetId: 'seller',
          action: 'suspend_user',
          reason: 'Escroqueries répétées',
        },
        transactionId: 'transaction',
      }),
    )
    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction',
      commit: true,
    })
  })

  it('refuse de suspendre un administrateur', async () => {
    vi.mocked(users.get).mockResolvedValue({
      $id: 'seller',
      labels: ['admin'],
    } as never)
    const failure = suspendReportedSeller(
      db,
      users,
      'smodeal',
      admin,
      input,
      now,
    )
    await expect(failure).rejects.toThrow(
      'Un administrateur ne peut pas être suspendu.',
    )
    expect(moderationActionResult(await failure.catch((e) => e))).toEqual({
      ok: false,
      code: 'admin_suspension',
      message: 'Un administrateur ne peut pas être suspendu.',
    })
    expect(users.updateStatus).not.toHaveBeenCalled()
    expect(db.updateRows).not.toHaveBeenCalled()
    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction',
      rollback: true,
    })
  })

  it('refuse qu’un administrateur se suspende lui-même', async () => {
    vi.mocked(db.getRow).mockImplementation((async (params: {
      tableId: string
    }) =>
      params.tableId === 'reports'
        ? { $id: 'report', listingId: 'listing', state: 'open' }
        : { ...listing, ownerId: 'admin' }) as never)
    vi.mocked(users.get).mockResolvedValue({
      $id: 'admin',
      labels: ['admin'],
    } as never)
    const failure = suspendReportedSeller(
      db,
      users,
      'smodeal',
      admin,
      input,
      now,
    )
    await expect(failure).rejects.toThrow(
      'Vous ne pouvez pas vous suspendre vous-même.',
    )
    expect(moderationActionResult(await failure.catch((e) => e))).toEqual({
      ok: false,
      code: 'self_suspension',
      message: 'Vous ne pouvez pas vous suspendre vous-même.',
    })
    expect(users.updateStatus).not.toHaveBeenCalled()
    expect(db.updateRows).not.toHaveBeenCalled()
  })

  it('ne suspend personne pour un signalement déjà traité', async () => {
    vi.mocked(db.getRow).mockResolvedValue({
      $id: 'report',
      listingId: 'listing',
      state: 'dismissed',
    } as never)
    await expect(
      suspendReportedSeller(db, users, 'smodeal', admin, input, now),
    ).rejects.toThrow('déjà traité')
    expect(users.updateStatus).not.toHaveBeenCalled()
  })

  it('annule le retrait des annonces si le journal échoue', async () => {
    vi.mocked(db.createRow).mockRejectedValue(new Error('service indisponible'))
    await expect(
      suspendReportedSeller(db, users, 'smodeal', admin, input, now),
    ).rejects.toThrow('service indisponible')
    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'transaction',
      rollback: true,
    })
    expect(db.updateTransaction).not.toHaveBeenCalledWith(
      expect.objectContaining({ commit: true }),
    )
  })
})
