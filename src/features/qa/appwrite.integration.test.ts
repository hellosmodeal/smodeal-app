import { randomBytes } from 'node:crypto'
import {
  Account,
  Client,
  ID,
  Query,
  Storage,
  TablesDB,
  Users,
} from 'node-appwrite'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  completeEmailVerification,
  completePasswordRecovery,
  createAccountAndSession,
  requestPasswordRecovery,
  sendEmailVerification,
} from '@/features/auth/auth.server'
import { revealListingPhone } from '@/features/contact/contact.server'
import {
  changeListingStatus,
  type ListingDependencies,
  publishListing,
  renewListing,
  updateListing,
} from '@/features/listings/listings.server'
import {
  listOpenReports,
  removeReportedListing,
  submitListingReport,
  suspendReportedSeller,
} from '@/features/moderation/moderation.server'
import { getServerEnv } from '@/server/env.server'

const inboxSchema = z.object({
  messages: z.array(z.object({ ID: z.string() })),
})
const messageSchema = z.object({ HTML: z.string(), Text: z.string() })

async function emailToken(email: string, path: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `http://127.0.0.1:18672/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    )
    const inbox = inboxSchema.parse(await response.json())
    for (const message of inbox.messages) {
      const result = await fetch(
        `http://127.0.0.1:18672/api/v1/message/${message.ID}`,
      )
      const content = messageSchema.parse(await result.json())
      const urls =
        `${content.HTML} ${content.Text}`.match(/https?:\/\/[^\s"<>]+/g) ?? []
      for (const raw of urls) {
        const url = new URL(raw.replaceAll('&amp;', '&'))
        if (url.origin === 'http://localhost:18671' && url.pathname === path) {
          return z
            .object({ userId: z.string().min(1), secret: z.string().min(1) })
            .parse(Object.fromEntries(url.searchParams))
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Email de recette non reçu dans Mailpit.')
}

// Opt-in explicite : la CI ordinaire ne crée aucun compte ni aucune donnée.
describe.skipIf(process.env.SMODEAL_QA !== '1')(
  'recette Appwrite locale',
  () => {
    it('vérifie les emails, photos, transactions, droits vendeur et modération sur les vrais services', async () => {
      const env = getServerEnv()
      const endpoint = new URL(env.APPWRITE_ENDPOINT)
      if (
        !['localhost', '127.0.0.1'].includes(endpoint.hostname) ||
        endpoint.port !== '18670' ||
        env.APPWRITE_PROJECT_ID !== 'smodeal-qa' ||
        env.PUBLIC_SITE_URL !== 'http://localhost:18671'
      )
        throw new Error(
          'La recette exige le projet local smodeal-qa sur les ports dédiés.',
        )

      const client = new Client()
        .setEndpoint(env.APPWRITE_ENDPOINT)
        .setProject(env.APPWRITE_PROJECT_ID)
        .setKey(env.APPWRITE_API_KEY)
      const account = new Account(client)
      const tables = new TablesDB(client)
      const storage = new Storage(client)
      const email = `seller-${randomBytes(6).toString('hex')}@smodeal.test`
      const password = randomBytes(24).toString('base64url')
      const session = await createAccountAndSession(account, {
        email,
        password,
        name: 'Vendeur fictif QA',
      })
      expect(session.secret).toBeTruthy()
      const sessionClient = new Client()
        .setEndpoint(env.APPWRITE_ENDPOINT)
        .setProject(env.APPWRITE_PROJECT_ID)
        .setSession(session.secret)
      const seller = new Account(sessionClient)
      const user = await seller.get()
      const deps: ListingDependencies = {
        getUser: () => seller.get(),
        databaseId: env.APPWRITE_DATABASE_ID,
        tables,
        storage,
        createId: ID.unique,
      }
      const image = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOuoAAAAASUVORK5CYII=',
        'base64',
      )
      const input = {
        title: 'Lampe fictive de recette',
        description: 'Annonce fictive pour la recette locale uniquement.',
        categorySlug: 'maison',
        condition: 'good' as const,
        priceCents: 2500,
        city: 'Lyon',
        postalCode: '69001',
        department: '69',
        phone: '0600000000',
        displayConsent: false,
        photos: [
          {
            name: 'recette.png',
            type: 'image/png',
            size: image.length,
            arrayBuffer: async () => Uint8Array.from(image).buffer,
          },
        ],
      }
      await expect(publishListing(input, new Date(), deps)).rejects.toThrow(
        'Vérifiez votre adresse email',
      )
      await sendEmailVerification(seller, env.PUBLIC_SITE_URL)
      const verification = await emailToken(email, '/verification-email')
      await completeEmailVerification(
        seller,
        verification.userId,
        verification.secret,
      )
      expect((await seller.get()).emailVerification).toBe(true)
      await expect(
        completeEmailVerification(
          seller,
          verification.userId,
          verification.secret,
        ),
      ).rejects.toThrow()

      const { id } = await publishListing(input, new Date(), deps)
      const listing = await tables.getRow({
        databaseId: deps.databaseId,
        tableId: 'listings',
        rowId: id,
      })
      expect(listing.ownerId).toBe(user.$id)
      expect(listing).not.toHaveProperty('phone')
      expect(listing.photoIds).toHaveLength(1)
      const photo = await fetch(
        `${env.APPWRITE_ENDPOINT}/storage/buckets/listing-photos/files/${listing.photoIds[0]}/view?project=${env.APPWRITE_PROJECT_ID}`,
      )
      expect(photo.status).toBe(200)
      expect(new Uint8Array(await photo.arrayBuffer())).toEqual(
        Uint8Array.from(image),
      )
      const contacts = await tables.listRows({
        databaseId: deps.databaseId,
        tableId: 'contacts',
        queries: [Query.equal('userId', user.$id)],
      })
      expect(contacts.rows[0]?.displayConsent).toBe(false)

      const readerSession = await createAccountAndSession(account, {
        email: `reader-${randomBytes(6).toString('hex')}@smodeal.test`,
        password: randomBytes(24).toString('base64url'),
        name: 'Lecteur fictif QA',
      })
      const reader = new Account(
        new Client()
          .setEndpoint(env.APPWRITE_ENDPOINT)
          .setProject(env.APPWRITE_PROJECT_ID)
          .setSession(readerSession.secret),
      )
      const readerUser = await reader.get()
      const contact = z
        .object({ phone: z.string(), displayConsent: z.boolean() })
        .parse(contacts.rows[0])
      await expect(
        revealListingPhone(id, {
          loadViewer: async () => ({
            id: readerUser.$id,
            suspended: !readerUser.status,
          }),
          findActiveListing: async () => ({ ownerId: user.$id }),
          findContact: async () => contact,
        }),
      ).resolves.toMatchObject({ ok: false })

      const publicPage = await fetch(`http://localhost:18671/annonces/${id}`)
      expect(publicPage.status).toBe(200)
      const html = await publicPage.text()
      expect(html).toContain(input.title)
      expect(html).not.toContain(input.phone)

      const strangerDeps = {
        ...deps,
        getUser: () => reader.get(),
      }
      await expect(
        changeListingStatus(id, 'sold', new Date(), strangerDeps),
      ).rejects.toThrow('ne peut pas être modifiée')
      const {
        phone: _phone,
        displayConsent: _consent,
        photos: _photos,
        ...publicFields
      } = input
      await updateListing(
        id,
        { ...publicFields, title: 'Lampe fictive modifiée' },
        deps,
      )
      const edited = await tables.getRow({
        databaseId: deps.databaseId,
        tableId: 'listings',
        rowId: id,
      })
      expect(edited.title).toBe('Lampe fictive modifiée')
      expect(edited.expiresAt).toBe(listing.expiresAt)
      expect(edited.photoIds).toEqual(listing.photoIds)
      await tables.updateRow({
        databaseId: deps.databaseId,
        tableId: 'listings',
        rowId: id,
        data: { expiresAt: new Date(Date.now() - 1000).toISOString() },
      })
      expect(
        (await fetch(`http://localhost:18671/annonces/${id}`)).status,
      ).toBe(404)
      await renewListing(id, new Date(), deps)
      expect(
        (await fetch(`http://localhost:18671/annonces/${id}`)).status,
      ).toBe(200)

      const actor = { id: readerUser.$id, labels: readerUser.labels }
      await submitListingReport(
        tables,
        deps.databaseId,
        actor,
        { listingId: id, reason: 'Signalement fictif pour recette.' },
        new Date(),
      )
      await expect(
        listOpenReports(tables, deps.databaseId, actor),
      ).rejects.toThrow('administrateurs')
      await new Users(client).updateLabels({
        userId: user.$id,
        labels: ['admin'],
      })
      const adminUser = await seller.get()
      const admin = { id: adminUser.$id, labels: adminUser.labels }
      const { reports } = await listOpenReports(tables, deps.databaseId, admin)
      const report = reports.find((item) => item.listingId === id)
      expect(report).toBeDefined()
      if (!report) throw new Error('Signalement de recette introuvable.')
      await removeReportedListing(
        tables,
        deps.databaseId,
        admin,
        { reportId: report.id, reason: 'Retrait fictif pour recette.' },
        new Date(),
      )
      expect(
        (
          await tables.getRow({
            databaseId: deps.databaseId,
            tableId: 'listings',
            rowId: id,
          })
        ).status,
      ).toBe('removed_by_moderation')
      await expect(updateListing(id, publicFields, deps)).rejects.toThrow(
        'ne peut pas être modifiée',
      )
      const logs = await tables.listRows({
        databaseId: deps.databaseId,
        tableId: 'moderation_logs',
        queries: [Query.equal('targetId', id)],
      })
      expect(logs.rows).toHaveLength(1)
      expect(logs.rows[0]?.action).toBe('remove_listing')
      expect(
        (
          await tables.getRow({
            databaseId: deps.databaseId,
            tableId: 'reports',
            rowId: report.id,
          })
        ).state,
      ).toBe('resolved')
      expect(
        (await fetch(`http://localhost:18671/annonces/${id}`)).status,
      ).toBe(404)

      const { id: keptId } = await publishListing(input, new Date(), deps)
      await submitListingReport(
        tables,
        deps.databaseId,
        actor,
        { listingId: keptId, reason: 'Signalement fictif à classer.' },
        new Date(),
      )
      const openReports = await listOpenReports(tables, deps.databaseId, admin)
      const dismissedReport = openReports.reports.find(
        (item) => item.listingId === keptId,
      )
      if (!dismissedReport)
        throw new Error('Signalement à classer introuvable.')
      const dismissal = {
        reportId: dismissedReport.id,
        reason: 'Annonce fictive conforme pour recette.',
        action: 'dismiss' as const,
      }
      const dismissedAt = new Date()
      await removeReportedListing(
        tables,
        deps.databaseId,
        admin,
        dismissal,
        dismissedAt,
      )
      const dismissedRow = await tables.getRow({
        databaseId: deps.databaseId,
        tableId: 'reports',
        rowId: dismissedReport.id,
      })
      expect(dismissedRow.state).toBe('dismissed')
      expect(new Date(dismissedRow.resolvedAt).getTime()).toBe(
        dismissedAt.getTime(),
      )
      expect(
        (
          await tables.getRow({
            databaseId: deps.databaseId,
            tableId: 'listings',
            rowId: keptId,
          })
        ).status,
      ).toBe('active')
      await expect(
        removeReportedListing(
          tables,
          deps.databaseId,
          admin,
          dismissal,
          new Date(),
        ),
      ).rejects.toThrow('déjà traité')
      const dismissalLogs = await tables.listRows({
        databaseId: deps.databaseId,
        tableId: 'moderation_logs',
        queries: [Query.equal('targetId', keptId)],
      })
      expect(dismissalLogs.rows).toHaveLength(1)
      expect(dismissalLogs.rows[0]).toMatchObject({
        action: 'dismiss_report',
        adminId: admin.id,
        reason: dismissal.reason,
      })
      expect(
        (await fetch(`http://localhost:18671/annonces/${keptId}`)).status,
      ).toBe(200)

      await requestPasswordRecovery(account, email, env.PUBLIC_SITE_URL)
      const recovery = await emailToken(email, '/reinitialiser-mot-de-passe')
      const newPassword = randomBytes(24).toString('base64url')
      await completePasswordRecovery(
        account,
        recovery.userId,
        recovery.secret,
        newPassword,
      )
      await expect(
        account.createEmailPasswordSession({ email, password }),
      ).rejects.toThrow()
      await expect(
        account.createEmailPasswordSession({ email, password: newPassword }),
      ).resolves.toHaveProperty('userId', user.$id)

      const freshSession = await account.createEmailPasswordSession({
        email,
        password: newPassword,
      })
      const freshSeller = new Account(
        new Client()
          .setEndpoint(env.APPWRITE_ENDPOINT)
          .setProject(env.APPWRITE_PROJECT_ID)
          .setSession(freshSession.secret),
      )
      const { id: suspendedId } = await publishListing(input, new Date(), {
        ...deps,
        getUser: () => freshSeller.get(),
      })
      await submitListingReport(
        tables,
        deps.databaseId,
        actor,
        { listingId: suspendedId, reason: 'Vendeur fictif à suspendre.' },
        new Date(),
      )
      const suspensionReport = (
        await listOpenReports(tables, deps.databaseId, admin)
      ).reports.find((item) => item.listingId === suspendedId)
      if (!suspensionReport)
        throw new Error('Signalement de suspension introuvable.')
      const users = new Users(client)
      const suspension = {
        reportId: suspensionReport.id,
        reason: 'Suspension fictive pour recette.',
      }
      await expect(
        suspendReportedSeller(
          tables,
          users,
          deps.databaseId,
          admin,
          suspension,
          new Date(),
        ),
      ).rejects.toThrow('administrateur')
      expect((await users.get({ userId: user.$id })).status).toBe(true)
      await users.updateLabels({ userId: user.$id, labels: [] })
      await users.updateLabels({ userId: readerUser.$id, labels: ['admin'] })
      await suspendReportedSeller(
        tables,
        users,
        deps.databaseId,
        { id: readerUser.$id, labels: ['admin'] },
        suspension,
        new Date(),
      )
      expect((await users.get({ userId: user.$id })).status).toBe(false)
      for (const listingId of [suspendedId, keptId])
        expect(
          (
            await tables.getRow({
              databaseId: deps.databaseId,
              tableId: 'listings',
              rowId: listingId,
            })
          ).status,
        ).toBe('removed_by_moderation')
      const suspensionLogs = await tables.listRows({
        databaseId: deps.databaseId,
        tableId: 'moderation_logs',
        queries: [Query.equal('targetId', user.$id)],
      })
      expect(suspensionLogs.rows).toHaveLength(1)
      expect(suspensionLogs.rows[0]).toMatchObject({
        action: 'suspend_user',
        targetType: 'user',
        adminId: readerUser.$id,
        reason: suspension.reason,
      })
      await expect(freshSeller.get()).rejects.toThrow()
      await expect(
        account.createEmailPasswordSession({ email, password: newPassword }),
      ).rejects.toThrow()
      expect(
        (await fetch(`http://localhost:18671/annonces/${keptId}`)).status,
      ).toBe(404)
    }, 60_000)
  },
)
