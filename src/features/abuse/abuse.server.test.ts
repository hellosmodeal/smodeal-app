import { AppwriteException } from 'node-appwrite'
import { describe, expect, it, vi } from 'vitest'
import { consumeRateLimit, RateLimitError } from './abuse.server'

function dependencies() {
  return {
    createTransaction: vi.fn(async () => ({ $id: 'tx-1' })),
    getRow: vi.fn(async () => ({
      $id: 'row-1',
      count: 2,
      windowStart: '2026-09-28T10:00:00.000Z',
    })),
    createRow: vi.fn(async () => ({})),
    updateRow: vi.fn(async () => ({})),
    incrementRowColumn: vi.fn(async () => ({})),
    updateTransaction: vi.fn(async () => ({})),
  }
}

describe('consumeRateLimit', () => {
  it('incrémente le compteur dans une transaction', async () => {
    const db = dependencies()

    await consumeRateLimit({
      db,
      databaseId: 'smodeal',
      action: 'auth_signin',
      subject: 'member:abc',
      secret: 'test-secret',
      now: new Date('2026-09-28T10:00:00.000Z'),
    })

    expect(db.incrementRowColumn).toHaveBeenCalledWith(
      expect.objectContaining({
        column: 'count',
        value: 1,
        max: 10,
      }),
    )
    expect(db.updateTransaction).toHaveBeenLastCalledWith({
      transactionId: 'tx-1',
      commit: true,
    })
  })

  it('bloque à la limite et annule la transaction', async () => {
    const db = dependencies()
    db.getRow.mockResolvedValue({
      $id: 'row-1',
      count: 10,
      windowStart: '2026-09-28T10:00:00.000Z',
    })

    await expect(
      consumeRateLimit({
        db,
        databaseId: 'smodeal',
        action: 'auth_signin',
        subject: 'member:abc',
        secret: 'test-secret',
        now: new Date('2026-09-28T10:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(RateLimitError)

    expect(db.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      rollback: true,
    })
  })

  it('crée la première ligne de la fenêtre', async () => {
    const db = dependencies()
    db.getRow.mockRejectedValue(new AppwriteException('Absent', 404))

    await consumeRateLimit({
      db,
      databaseId: 'smodeal',
      action: 'auth_signup',
      subject: 'anonymous:global',
      secret: 'test-secret',
      now: new Date('2026-09-28T10:00:00.000Z'),
    })

    expect(db.createRow).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ count: 1 }) }),
    )
  })

  it('réutilise la même ligne à la fenêtre suivante', async () => {
    const db = dependencies()
    db.getRow.mockResolvedValue({
      $id: 'row-1',
      count: 10,
      windowStart: '2026-09-28T10:00:00.000Z',
    })

    await consumeRateLimit({
      db,
      databaseId: 'smodeal',
      action: 'auth_signin',
      subject: 'member:abc',
      secret: 'test-secret',
      now: new Date('2026-09-28T10:15:00.000Z'),
    })

    expect(db.createRow).not.toHaveBeenCalled()
    expect(db.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          count: 1,
          windowStart: '2026-09-28T10:15:00.000Z',
          windowEnd: '2026-09-28T10:30:00.000Z',
        },
      }),
    )
  })

  it('reconnaît une fenêtre Appwrite écrite avec un décalage UTC', async () => {
    const db = dependencies()
    db.getRow.mockResolvedValue({
      $id: 'row-1',
      count: 2,
      windowStart: '2026-09-28T12:00:00+02:00',
    })

    await consumeRateLimit({
      db,
      databaseId: 'smodeal',
      action: 'auth_signin',
      subject: 'member:abc',
      secret: 'test-secret',
      now: new Date('2026-09-28T10:00:00.000Z'),
    })

    expect(db.incrementRowColumn).toHaveBeenCalled()
    expect(db.updateRow).not.toHaveBeenCalled()
  })

  it('réessaie un conflit de transaction borné', async () => {
    const db = dependencies()
    db.updateTransaction
      .mockRejectedValueOnce(new AppwriteException('Conflit', 409))
      .mockResolvedValue({})
    db.createTransaction
      .mockResolvedValueOnce({ $id: 'tx-1' })
      .mockResolvedValueOnce({ $id: 'tx-2' })

    await consumeRateLimit({
      db,
      databaseId: 'smodeal',
      action: 'auth_signin',
      subject: 'member:abc',
      secret: 'test-secret',
      now: new Date('2026-09-28T10:00:00.000Z'),
    })

    expect(db.createTransaction).toHaveBeenCalledTimes(2)
  })

  it('échoue fermé après les conflits répétés', async () => {
    const db = dependencies()
    db.updateTransaction.mockRejectedValue(
      new AppwriteException('Conflit', 409),
    )

    await expect(
      consumeRateLimit({
        db,
        databaseId: 'smodeal',
        action: 'auth_signin',
        subject: 'member:abc',
        secret: 'test-secret',
        now: new Date('2026-09-28T10:00:00.000Z'),
      }),
    ).rejects.toThrow('indisponible')
  })
})
