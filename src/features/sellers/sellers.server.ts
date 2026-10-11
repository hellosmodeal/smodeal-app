import { type Models, Query } from 'node-appwrite'
import { adminClient } from '@/features/auth/session.server'
import {
  listOwnerListings,
  type PublicListing,
  type PublicListingRow,
  toPublicListing,
} from '@/features/search/listings.server'
import { getServerEnv } from '@/server/env.server'

export type PublicSellerProfile = {
  pseudonym: string
  memberSince: string
  listings: PublicListing[]
  total: number
}

export type SellerProfileDependencies = {
  findProfile: (
    profileId: string,
  ) => Promise<{ userId: string; pseudonym: string } | null>
  findMember: (
    userId: string,
  ) => Promise<{ createdAt: string; active: boolean } | null>
  listActiveListings: (
    ownerId: string,
    now: Date,
  ) => Promise<{ rows: PublicListingRow[]; total: number }>
}

const productionDependencies: SellerProfileDependencies = {
  async findProfile(profileId) {
    const response = await adminClient().tablesDB.listRows<
      Models.Row & { userId: string; pseudonym: string }
    >({
      databaseId: getServerEnv().APPWRITE_DATABASE_ID,
      tableId: 'profiles',
      queries: [
        Query.equal('$id', profileId),
        Query.select(['$id', 'userId', 'pseudonym']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    const row = response.rows[0]
    return row ? { userId: row.userId, pseudonym: row.pseudonym } : null
  },
  async findMember(userId) {
    try {
      const user = await adminClient().users.get({ userId })
      return { createdAt: user.$createdAt, active: user.status }
    } catch {
      return null
    }
  },
  listActiveListings: listOwnerListings,
}

export async function getPublicSellerProfile(
  profileId: string,
  now: Date,
  dependencies: SellerProfileDependencies = productionDependencies,
): Promise<PublicSellerProfile | null> {
  const profile = await dependencies.findProfile(profileId)
  if (!profile) return null
  const member = await dependencies.findMember(profile.userId)
  if (!member?.active) return null
  const { rows, total } = await dependencies.listActiveListings(
    profile.userId,
    now,
  )
  return {
    pseudonym: profile.pseudonym,
    memberSince: member.createdAt,
    listings: rows
      .map((row) => toPublicListing(row))
      .filter((listing): listing is PublicListing => listing !== null),
    total,
  }
}
