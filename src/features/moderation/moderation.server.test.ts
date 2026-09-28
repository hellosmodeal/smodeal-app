import { Client, TablesDB } from 'node-appwrite'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listOpenReports,
  removeReportedListing,
  reportErrorResult,
  submitListingReport,
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

  it('pagine les signalements sans exposer l’identifiant du déclarant', async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({
      $id: `report-${i}`,
      listingId: 'listing',
      reason: 'Annonce trompeuse',
      $createdAt: now.toISOString(),
      reporterId: 'private-user',
    }))
    vi.spyOn(db, 'listRows').mockResolvedValue({ rows, total: 26 } as never)
    const result = await listOpenReports(db, 'smodeal', admin)
    expect(result.reports).toHaveLength(25)
    expect(result.hasMore).toBe(true)
    expect(result.reports[0]).toEqual({
      id: 'report-0',
      listingId: 'listing',
      reason: 'Annonce trompeuse',
      createdAt: now.toISOString(),
    })
  })

  it('masque les messages internes du service de données', () => {
    expect(reportErrorResult(new Error('secret interne'))).toEqual({
      ok: false,
      message: 'Signalement impossible pour le moment.',
    })
  })
})
