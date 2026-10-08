import {
  AppwriteException,
  ID,
  Query,
  type TablesDB,
  type Users,
} from 'node-appwrite'
import { ZodError } from 'zod'
import { isAdmin } from '@/features/auth/rules'
import { isPubliclyVisible } from '@/features/listings/rules'
import {
  type ModerationActionResult,
  type ModerationActor,
  type ModerationErrorCode,
  type OpenReport,
  type RemovalInput,
  type ReportedListing,
  type ReportInput,
  removalSchema,
  reportSchema,
  type SuspensionInput,
  suspensionSchema,
} from './rules'

class ModerationError extends Error {
  constructor(
    message: string,
    readonly code: ModerationErrorCode = 'invalid',
  ) {
    super(message)
  }
}

export function moderationActionResult(error: unknown): ModerationActionResult {
  if (error instanceof ModerationError)
    return { ok: false, code: error.code, message: error.message }
  if (error instanceof ZodError)
    return {
      ok: false,
      code: 'invalid',
      message: error.issues[0]?.message ?? 'Saisie invalide.',
    }
  return {
    ok: false,
    code: 'unavailable',
    message:
      'Action impossible. Rechargez pour vérifier l’état du signalement.',
  }
}

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
    throw new ModerationError('Accès réservé aux administrateurs.', 'forbidden')
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
  now: Date = new Date(),
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
  const rows = result.rows.slice(0, 25)
  const listings = await reportedListings(
    db,
    databaseId,
    rows.map((row) => row.listingId),
    now,
  )
  return {
    reports: rows.map((row) => ({
      id: row.$id,
      listingId: row.listingId,
      reason: row.reason,
      createdAt: row.$createdAt,
      listing: listings.get(row.listingId) ?? null,
    })),
    hasMore: result.rows.length > 25,
  }
}

async function reportedListings(
  db: TablesDB,
  databaseId: string,
  listingIds: string[],
  now: Date,
): Promise<Map<string, ReportedListing>> {
  const ids = [...new Set(listingIds)]
  if (!ids.length) return new Map()
  // Lecture serveur sans filtre de statut : l’administrateur voit aussi les annonces retirées ou expirées.
  const result = await db.listRows({
    databaseId,
    tableId: 'listings',
    queries: [
      Query.equal('$id', ids),
      Query.select(['$id', 'title', 'status', 'ownerId', 'expiresAt']),
      Query.limit(ids.length),
    ],
  })
  return new Map(
    result.rows.map((row) => [
      row.$id,
      {
        title: row.title,
        status: row.status,
        publiclyVisible: isPubliclyVisible(
          {
            ownerId: row.ownerId,
            status: row.status,
            expiresAt: row.expiresAt,
          },
          now,
        ),
      },
    ]),
  )
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
      throw new ModerationError(
        'Ce signalement est déjà traité.',
        'already_handled',
      )
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
      throw new ModerationError(
        'Ce signalement est déjà traité.',
        'already_handled',
      )
    const listing = await db.getRow({
      databaseId,
      tableId: 'listings',
      rowId: report.listingId,
      transactionId: transaction.$id,
    })
    if (listing.ownerId === actor.id)
      throw new ModerationError(
        'Vous ne pouvez pas vous suspendre vous-même.',
        'self_suspension',
      )
    const seller = await users.get({ userId: listing.ownerId })
    if (seller.$id === actor.id)
      throw new ModerationError(
        'Vous ne pouvez pas vous suspendre vous-même.',
        'self_suspension',
      )
    if (isAdmin(seller))
      throw new ModerationError(
        'Un administrateur ne peut pas être suspendu.',
        'admin_suspension',
      )
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
