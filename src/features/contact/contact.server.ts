import { type Models, Query } from 'node-appwrite'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { listingStorage } from '@/features/search/listings.server'
import type { PhoneRevealResult } from './functions'
import { canRevealPhone } from './rules'

type PrivateListingRow = Models.Row & { ownerId: string }
type ContactRow = Models.Row & {
  userId: string
  phone: string
  displayConsent: boolean
}

export type PhoneRevealDependencies = {
  loadViewer: () => Promise<{ id: string; suspended: boolean } | null>
  findActiveListing: (
    listingId: string,
    now: Date,
  ) => Promise<{ ownerId: string } | null>
  findContact: (
    ownerId: string,
  ) => Promise<{ phone: string; displayConsent: boolean } | null>
}

const productionDependencies: PhoneRevealDependencies = {
  async loadViewer() {
    const viewer = await loadCurrentUser()
    return viewer ? { id: viewer.$id, suspended: !viewer.status } : null
  },
  async findActiveListing(listingId, now) {
    const { tablesDB } = adminClient()
    const listing = await tablesDB.listRows<PrivateListingRow>({
      databaseId: listingStorage.databaseId,
      tableId: listingStorage.listingsTableId,
      queries: [
        Query.equal('$id', listingId),
        Query.equal('status', 'active'),
        Query.greaterThan('expiresAt', now.toISOString()),
        Query.select(['$id', 'ownerId']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    return listing.rows[0] ?? null
  },
  async findContact(ownerId) {
    const { tablesDB } = adminClient()
    const contacts = await tablesDB.listRows<ContactRow>({
      databaseId: listingStorage.databaseId,
      tableId: listingStorage.contactsTableId,
      queries: [
        Query.equal('userId', ownerId),
        Query.select(['userId', 'phone', 'displayConsent']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    return contacts.rows[0] ?? null
  },
}

export async function revealListingPhone(
  listingId: string,
  dependencies: PhoneRevealDependencies = productionDependencies,
): Promise<PhoneRevealResult> {
  const viewer = await dependencies.loadViewer()
  if (!viewer)
    return { ok: false, message: 'Connectez-vous pour voir le numéro.' }

  const listingRow = await dependencies.findActiveListing(listingId, new Date())
  if (!listingRow)
    return { ok: false, message: 'Cette annonce n’est plus disponible.' }

  const contact = await dependencies.findContact(listingRow.ownerId)
  if (
    !contact ||
    !canRevealPhone(viewer, {
      ownerId: listingRow.ownerId,
      displayConsent: contact.displayConsent,
    })
  ) {
    return {
      ok: false,
      message: 'Le vendeur ne souhaite pas afficher son numéro.',
    }
  }
  return { ok: true, phone: contact.phone }
}
