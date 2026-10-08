import {
  AppwriteException,
  ID,
  Query,
  type TablesDB,
  type Users,
} from 'node-appwrite'
import { isAdmin } from '@/features/auth/rules'
import { isPubliclyVisible } from '@/features/listings/rules'
import {
  type ModerationActor,
  type OpenReport,
  type RemovalInput,
  type ReportInput,
  removalSchema,
  reportSchema,
  type SuspensionInput,
  suspensionSchema,
} from './rules'

class ModerationError extends Error {}

export function reportErrorResult(error: unknown): {
  ok: boolean
  message: string
} {
  if (error instanceof AppwriteException && error.code === 409)
    return { ok: true, message: 'Vous avez déjà signalé cette annonce.' }
  return {
    ok: false,
    message:
      error instanceof ModerationError
        ? error.message
        : 'Signalement impossible pour le moment.',
  }
}

function requireAdmin(
  actor: ModerationActor | null,
): asserts actor is ModerationActor {
  if (!actor || !isAdmin(actor))
    throw new ModerationError('Accès réservé aux administrateurs.')
}

export async function submitListingReport(
  db: TablesDB,
  databaseId: string,
  actor: ModerationActor | null,
  input: ReportInput,
  now: Date,
): Promise<void> {
  if (!actor)
    throw new ModerationError('Connectez-vous pour signaler une annonce.')
  const data = reportSchema.parse(input)
  const listing = await db.getRow({
    databaseId,
    tableId: 'listings',
    rowId: data.listingId,
  })
  if (
    !isPubliclyVisible(
      {
        ownerId: listing.ownerId,
        status: listing.status,
        expiresAt: listing.expiresAt,
      },
      now,
    )
  )
    throw new ModerationError('Cette annonce est indisponible.')
  if (listing.ownerId === actor.id)
    throw new ModerationError(
      'Vous ne pouvez pas signaler votre propre annonce.',
    )
  // Une ligne déterministe évite plusieurs signalements du même membre pour une annonce.
  // Le SHA-256 est tronqué à la taille maximale des identifiants Appwrite.
  const { createHash } = await import('node:crypto')
  const rowId = createHash('sha256')
    .update(JSON.stringify([actor.id, data.listingId]))
    .digest('hex')
    .slice(0, 36)
  await db.createRow({
    databaseId,
    tableId: 'reports',
    rowId,
    data: { ...data, reporterId: actor.id, state: 'open' },
  })
}

export async function listOpenReports(
  db: TablesDB,
  databaseId: string,
  actor: ModerationActor | null,
  after?: string,
): Promise<{ reports: OpenReport[]; hasMore: boolean }> {
  requireAdmin(actor)
  const result = await db.listRows({
    databaseId,
    tableId: 'reports',
    queries: [
      Query.equal('state', 'open'),
      Query.orderAsc('$createdAt'),
      Query.orderAsc('$id'),
      Query.limit(26),
      ...(after ? [Query.cursorAfter(after)] : []),
    ],
  })
  return {
    reports: result.rows.slice(0, 25).map((row) => ({
      id: row.$id,
      listingId: row.listingId,
      reason: row.reason,
      createdAt: row.$createdAt,
    })),
    hasMore: result.rows.length > 25,
  }
}

export async function removeReportedListing(
  db: TablesDB,
  databaseId: string,
  actor: ModerationActor | null,
  input: RemovalInput,
  now: Date,
): Promise<void> {
  requireAdmin(actor)
  const data = removalSchema.parse(input)
  const transaction = await db.createTransaction({ ttl: 60 })
  try {
    const report = await db.getRow({
      databaseId,
      tableId: 'reports',
      rowId: data.reportId,
      transactionId: transaction.$id,
    })
    if (report.state !== 'open')
      throw new ModerationError('Ce signalement est déjà traité.')
    if (data.action !== 'dismiss')
      await db.updateRow({
        databaseId,
        tableId: 'listings',
        rowId: report.listingId,
        data: { status: 'removed_by_moderation' },
        transactionId: transaction.$id,
      })
    await db.updateRow({
      databaseId,
      tableId: 'reports',
      rowId: report.$id,
      data: {
        state: data.action === 'dismiss' ? 'dismissed' : 'resolved',
        resolvedAt: now.toISOString(),
      },
      transactionId: transaction.$id,
    })
    await db.createRow({
      databaseId,
      tableId: 'moderation_logs',
      rowId: ID.unique(),
      data: {
        adminId: actor.id,
        targetType: 'listing',
        targetId: report.listingId,
        action: data.action === 'dismiss' ? 'dismiss_report' : 'remove_listing',
        reason: data.reason,
      },
      transactionId: transaction.$id,
    })
    await db.updateTransaction({ transactionId: transaction.$id, commit: true })
  } catch (error) {
    await db
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => undefined)
    throw error
  }
}

export async function suspendReportedSeller(
  db: TablesDB,
  users: Pick<Users, 'get' | 'updateStatus' | 'deleteSessions'>,
  databaseId: string,
  actor: ModerationActor | null,
  input: SuspensionInput,
  now: Date,
): Promise<void> {
  requireAdmin(actor)
  const data = suspensionSchema.parse(input)
  const transaction = await db.createTransaction({ ttl: 60 })
  try {
    const report = await db.getRow({
      databaseId,
      tableId: 'reports',
      rowId: data.reportId,
      transactionId: transaction.$id,
    })
    if (report.state !== 'open')
      throw new ModerationError('Ce signalement est déjà traité.')
    const listing = await db.getRow({
      databaseId,
      tableId: 'listings',
      rowId: report.listingId,
      transactionId: transaction.$id,
    })
    const seller = await users.get({ userId: listing.ownerId })
    if (seller.$id === actor.id || isAdmin(seller))
      throw new ModerationError('Impossible de suspendre un administrateur.')
    // Le blocage précède le retrait : un nouvel essai après échec reste possible et sans effet de bord.
    await users.updateStatus({ userId: seller.$id, status: false })
    await users.deleteSessions({ userId: seller.$id })
    await db.updateRows({
      databaseId,
      tableId: 'listings',
      data: { status: 'removed_by_moderation' },
      queries: [
        Query.equal('ownerId', seller.$id),
        Query.equal('status', ['active', 'expired']),
      ],
      transactionId: transaction.$id,
    })
    await db.updateRow({
      databaseId,
      tableId: 'reports',
      rowId: report.$id,
      data: { state: 'resolved', resolvedAt: now.toISOString() },
      transactionId: transaction.$id,
    })
    await db.createRow({
      databaseId,
      tableId: 'moderation_logs',
      rowId: ID.unique(),
      data: {
        adminId: actor.id,
        targetType: 'user',
        targetId: seller.$id,
        action: 'suspend_user',
        reason: data.reason,
      },
      transactionId: transaction.$id,
    })
    await db.updateTransaction({ transactionId: transaction.$id, commit: true })
  } catch (error) {
    await db
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => undefined)
    throw error
  }
}
