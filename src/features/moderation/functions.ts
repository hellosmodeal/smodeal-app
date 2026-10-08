import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  RateLimitError,
  RateLimitUnavailableError,
} from '@/features/abuse/abuse.server'
import { limitMemberAction } from '@/features/abuse/functions.server'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import {
  listOpenReports,
  moderationActionResult,
  removeReportedListing,
  reportErrorResult,
  submitListingReport,
  suspendReportedSeller,
} from './moderation.server'
import {
  type ModerationActionResult,
  removalSchema,
  reportSchema,
  suspensionSchema,
} from './rules'

async function moderationContext() {
  const user = await loadCurrentUser()
  return {
    actor: user ? { id: user.$id, labels: user.labels } : null,
    db: adminClient().tablesDB,
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
  }
}

export const reportListing = createServerFn({ method: 'POST' })
  .inputValidator(reportSchema)
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    const { actor, db, databaseId } = await moderationContext()
    try {
      if (actor) await limitMemberAction('report_submit', actor.id)
      await submitListingReport(db, databaseId, actor, data, new Date())
      return {
        ok: true,
        message: 'Merci. Le signalement a été transmis à la modération.',
      }
    } catch (error) {
      if (error instanceof Response) throw error
      if (
        error instanceof RateLimitError ||
        error instanceof RateLimitUnavailableError
      )
        return { ok: false, message: error.message }
      return reportErrorResult(error)
    }
  })

export const getOpenReports = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ after: z.string().max(36).optional() }))
  .handler(async ({ data }) => {
    const { actor, db, databaseId } = await moderationContext()
    return listOpenReports(db, databaseId, actor, data.after, new Date())
  })

export const removeListingByReport = createServerFn({ method: 'POST' })
  .inputValidator(removalSchema)
  .handler(async ({ data }): Promise<ModerationActionResult> => {
    const { actor, db, databaseId } = await moderationContext()
    try {
      await removeReportedListing(db, databaseId, actor, data, new Date())
      return { ok: true }
    } catch (error) {
      if (error instanceof Response) throw error
      return moderationActionResult(error)
    }
  })

export const suspendSellerByReport = createServerFn({ method: 'POST' })
  .inputValidator(suspensionSchema)
  .handler(async ({ data }): Promise<ModerationActionResult> => {
    const { actor, db, databaseId } = await moderationContext()
    try {
      await suspendReportedSeller(
        db,
        adminClient().users,
        databaseId,
        actor,
        data,
        new Date(),
      )
      return { ok: true }
    } catch (error) {
      if (error instanceof Response) throw error
      return moderationActionResult(error)
    }
  })
