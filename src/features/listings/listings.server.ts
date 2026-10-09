import { ID, Query } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import type { UploadedPhoto } from './listing-form'
import {
  canChangeListingStatus,
  canEditListing,
  canManageListing,
  canRenewListing,
  computeExpiresAt,
  hasExpectedPhotoSignature,
  type ListingLifecycle,
  MAX_LISTING_PHOTOS,
  photoValidationMessage,
} from './rules'

const LISTINGS_TABLE_ID = 'listings'
const CONTACTS_TABLE_ID = 'contacts'
const PHOTOS_BUCKET_ID = 'listing-photos'

type ListingInput = {
  title: string
  description: string
  categorySlug: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  priceCents: number
  city: string
  postalCode: string
  department: string
  phone: string
  displayConsent: boolean
}

export type PublishListingInput = ListingInput & { photos: UploadedPhoto[] }
export type ListingEditInput = Omit<ListingInput, 'phone' | 'displayConsent'>
export type ListingForEditing = ListingEditInput & { id: string }

type CurrentUser = { $id: string; emailVerification: boolean }

type ListingRow = ListingLifecycle & {
  $id: string
  title: string
  description: string
  categorySlug: string
  condition: ListingInput['condition']
  priceCents: number
  city: string
  postalCode: string
  department: string
  photoIds?: string[]
  publishedAt: string
  soldAt?: string
}

type Tables = {
  createRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    data: Record<string, unknown>
    transactionId?: string
  }) => Promise<ListingRow | { $id: string }>
  updateRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    data: Record<string, unknown>
    transactionId?: string
  }) => Promise<ListingRow>
  getRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    transactionId?: string
  }) => Promise<ListingRow>
  listRows: (params: {
    databaseId: string
    tableId: string
    queries?: string[]
    transactionId?: string
  }) => Promise<{ rows: Array<{ $id: string }> }>
  createTransaction: (params: { ttl: number }) => Promise<{ $id: string }>
  updateTransaction: (params: {
    transactionId: string
    commit?: boolean
    rollback?: boolean
  }) => Promise<unknown>
}

type Storage = {
  createFile: (params: {
    bucketId: string
    fileId: string
    file: InputFile
  }) => Promise<{ $id: string }>
  deleteFile: (params: { bucketId: string; fileId: string }) => Promise<unknown>
}

export type ListingDependencies = {
  getUser: () => Promise<CurrentUser | null>
  databaseId: string
  tables: Tables
  storage: Storage
  createId: () => string
}

function dependencies(): ListingDependencies {
  const client = adminClient()
  return {
    getUser: loadCurrentUser,
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
    tables: client.tablesDB,
    storage: client.storage,
    createId: ID.unique,
  }
}

function requireVerifiedUser(
  user: CurrentUser | null,
): asserts user is CurrentUser {
  if (!user)
    throw new Error('Vous devez être connecté pour publier une annonce.')
  if (!user.emailVerification)
    throw new Error(
      'Vérifiez votre adresse email avant de publier une annonce.',
    )
}

function toSellerListing(row: ListingRow) {
  return {
    id: row.$id,
    title: row.title,
    categorySlug: row.categorySlug,
    priceCents: row.priceCents,
    city: row.city,
    status: row.status,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    photoIds: row.photoIds ?? [],
  }
}

function toListingForEditing(row: ListingRow): ListingForEditing {
  return {
    id: row.$id,
    title: row.title,
    description: row.description,
    categorySlug: row.categorySlug,
    condition: row.condition,
    priceCents: row.priceCents,
    city: row.city,
    postalCode: row.postalCode,
    department: row.department,
  }
}

async function saveContact(
  tables: Tables,
  databaseId: string,
  userId: string,
  phone: string,
  displayConsent: boolean,
  createId: () => string,
  transactionId: string,
): Promise<void> {
  const contacts = await tables.listRows({
    databaseId,
    tableId: CONTACTS_TABLE_ID,
    queries: [Query.equal('userId', userId), Query.limit(1)],
    transactionId,
  })
  const data = { userId, phone, displayConsent }
  const contact = contacts.rows[0]
  if (contact) {
    await tables.updateRow({
      databaseId,
      tableId: CONTACTS_TABLE_ID,
      rowId: contact.$id,
      data,
      transactionId,
    })
    return
  }
  await tables.createRow({
    databaseId,
    tableId: CONTACTS_TABLE_ID,
    rowId: createId(),
    data,
    transactionId,
  })
}

export async function publishListing(
  input: PublishListingInput,
  now = new Date(),
  deps = dependencies(),
): Promise<{ id: string }> {
  const user = await deps.getUser()
  requireVerifiedUser(user)
  if (input.photos.length > MAX_LISTING_PHOTOS)
    throw new Error('Vous pouvez ajouter jusqu’à 5 photos.')
  for (const photo of input.photos) {
    const message = photoValidationMessage(photo)
    if (message) throw new Error(message)
  }

  const photoIds: string[] = []
  let transactionId: string | undefined
  let commitStarted = false
  try {
    for (const photo of input.photos) {
      const fileId = deps.createId()
      const buffer = new Uint8Array(await photo.arrayBuffer())
      if (!hasExpectedPhotoSignature(buffer, photo.type))
        throw new Error(
          'Le contenu de la photo ne correspond pas à son format.',
        )
      photoIds.push(fileId)
      await deps.storage.createFile({
        bucketId: PHOTOS_BUCKET_ID,
        fileId,
        file: InputFile.fromBuffer(buffer, photo.name),
      })
    }
    const transaction = await deps.tables.createTransaction({ ttl: 60 })
    transactionId = transaction.$id
    await saveContact(
      deps.tables,
      deps.databaseId,
      user.$id,
      input.phone,
      input.displayConsent,
      deps.createId,
      transactionId,
    )
    const id = deps.createId()
    const publishedAt = now.toISOString()
    await deps.tables.createRow({
      databaseId: deps.databaseId,
      tableId: LISTINGS_TABLE_ID,
      rowId: id,
      data: {
        ownerId: user.$id,
        title: input.title,
        description: input.description,
        categorySlug: input.categorySlug,
        condition: input.condition,
        priceCents: input.priceCents,
        city: input.city,
        postalCode: input.postalCode,
        department: input.department,
        photoIds,
        status: 'active',
        publishedAt,
        expiresAt: computeExpiresAt(now),
      },
      transactionId,
    })
    commitStarted = true
    await deps.tables.updateTransaction({ transactionId, commit: true })
    return { id }
  } catch (error) {
    if (transactionId && !commitStarted)
      await deps.tables
        .updateTransaction({ transactionId, rollback: true })
        .catch(() => undefined)
    if (!commitStarted)
      await Promise.all(
        photoIds.map((fileId) =>
          deps.storage
            .deleteFile({ bucketId: PHOTOS_BUCKET_ID, fileId })
            .catch(() => undefined),
        ),
      )
    throw error
  }
}

async function ownedListing(
  id: string,
  actorId: string,
  tables: Tables,
  databaseId: string,
  transactionId: string,
): Promise<ListingRow> {
  const listing = await tables.getRow({
    databaseId,
    tableId: LISTINGS_TABLE_ID,
    rowId: id,
    transactionId,
  })
  if (!canManageListing(listing, actorId))
    throw new Error('Cette annonce ne peut pas être modifiée.')
  return listing
}

async function editableListing(
  id: string,
  actorId: string,
  tables: Tables,
  databaseId: string,
  transactionId?: string,
): Promise<ListingRow> {
  const listing = await tables.getRow({
    databaseId,
    tableId: LISTINGS_TABLE_ID,
    rowId: id,
    transactionId,
  })
  if (!canEditListing(listing, actorId))
    throw new Error('Cette annonce ne peut pas être modifiée.')
  return listing
}

export async function getSellerListings(
  after?: string,
  deps = dependencies(),
): Promise<{
  items: ReturnType<typeof toSellerListing>[]
  nextCursor?: string
}> {
  const user = await deps.getUser()
  if (!user) throw new Error('Vous devez être connecté.')
  const result = await deps.tables.listRows({
    databaseId: deps.databaseId,
    tableId: LISTINGS_TABLE_ID,
    queries: [
      Query.equal('ownerId', user.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(26),
      ...(after ? [Query.cursorAfter(after)] : []),
    ],
  })
  const rows = result.rows as ListingRow[]
  return {
    items: rows.slice(0, 25).map(toSellerListing),
    nextCursor: rows.length > 25 ? rows[24]?.$id : undefined,
  }
}

export async function getListingForEditing(
  id: string,
  deps = dependencies(),
): Promise<ListingForEditing> {
  const user = await deps.getUser()
  if (!user) throw new Error('Vous devez être connecté.')
  const listing = await editableListing(
    id,
    user.$id,
    deps.tables,
    deps.databaseId,
  )
  return toListingForEditing(listing)
}

export async function updateListing(
  id: string,
  input: ListingEditInput,
  deps = dependencies(),
): Promise<void> {
  const user = await deps.getUser()
  requireVerifiedUser(user)
  const transaction = await deps.tables.createTransaction({ ttl: 60 })
  try {
    await editableListing(
      id,
      user.$id,
      deps.tables,
      deps.databaseId,
      transaction.$id,
    )
    await deps.tables.updateRow({
      databaseId: deps.databaseId,
      tableId: LISTINGS_TABLE_ID,
      rowId: id,
      data: input,
      transactionId: transaction.$id,
    })
    await deps.tables.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    })
  } catch (error) {
    await deps.tables
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => undefined)
    throw error
  }
}

export async function changeListingStatus(
  id: string,
  status: 'sold' | 'withdrawn',
  now = new Date(),
  deps = dependencies(),
): Promise<void> {
  const user = await deps.getUser()
  if (!user) throw new Error('Vous devez être connecté.')
  const transaction = await deps.tables.createTransaction({ ttl: 60 })
  try {
    const listing = await ownedListing(
      id,
      user.$id,
      deps.tables,
      deps.databaseId,
      transaction.$id,
    )
    if (!canChangeListingStatus(listing, user.$id))
      throw new Error('Cette annonce ne peut pas changer de statut.')
    await deps.tables.updateRow({
      databaseId: deps.databaseId,
      tableId: LISTINGS_TABLE_ID,
      rowId: id,
      data: { status, soldAt: status === 'sold' ? now.toISOString() : null },
      transactionId: transaction.$id,
    })
    await deps.tables.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    })
  } catch (error) {
    await deps.tables
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => undefined)
    throw error
  }
}

export async function renewListing(
  id: string,
  now = new Date(),
  deps = dependencies(),
): Promise<void> {
  const user = await deps.getUser()
  requireVerifiedUser(user)
  const transaction = await deps.tables.createTransaction({ ttl: 60 })
  try {
    const listing = await ownedListing(
      id,
      user.$id,
      deps.tables,
      deps.databaseId,
      transaction.$id,
    )
    if (!canRenewListing(listing, user.$id, now))
      throw new Error('Cette annonce ne peut pas être renouvelée.')
    await deps.tables.updateRow({
      databaseId: deps.databaseId,
      tableId: LISTINGS_TABLE_ID,
      rowId: id,
      data: {
        status: 'active',
        publishedAt: now.toISOString(),
        expiresAt: computeExpiresAt(now),
        soldAt: null,
      },
      transactionId: transaction.$id,
    })
    await deps.tables.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    })
  } catch (error) {
    await deps.tables
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => undefined)
    throw error
  }
}
