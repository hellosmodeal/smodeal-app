import { Client, TablesDB } from 'node-appwrite'
import { describe, expect, it, vi } from 'vitest'
import { listSitemapListings } from './sitemap.server'

const now = new Date('2026-10-08T12:00:00.000Z')

function row(id: string, updatedAt: string) {
  return {
    $id: id,
    $updatedAt: updatedAt,
    publishedAt: '2026-10-01T00:00:00.000Z',
  }
}

function queriesOfCall(db: TablesDB, index: number): string[] {
  const params: unknown = vi.mocked(db.listRows).mock.calls[index]?.[0]
  if (typeof params !== 'object' || params === null) return []
  if (!('queries' in params) || !Array.isArray(params.queries)) return []
  return params.queries.map(String)
}

describe('listSitemapListings', () => {
  it('ne demande que les annonces actives non expirées et leurs dates', async () => {
    const db = new TablesDB(new Client())
    vi.spyOn(db, 'listRows').mockResolvedValue({
      total: 1,
      rows: [row('annonce-1', '2026-10-05T09:00:00.000Z')],
    } as never)

    const entries = await listSitemapListings(db, 'smodeal', now)

    expect(entries).toEqual([
      { id: 'annonce-1', lastmod: '2026-10-05T09:00:00.000Z' },
    ])
    const queries = queriesOfCall(db, 0)
    expect(queries).toContainEqual(expect.stringContaining('"status"'))
    expect(
      queries.some(
        (query) =>
          query.includes('expiresAt') && query.includes(now.toISOString()),
      ),
    ).toBe(true)
    const select = queries.find((query) => query.includes('"select"'))
    expect(select).toBeDefined()
    expect(select).not.toContain('title')
    expect(select).not.toContain('ownerId')
  })

  it('pagine par curseur jusqu’à épuisement des résultats', async () => {
    const db = new TablesDB(new Client())
    const firstPage = Array.from({ length: 500 }, (_, index) =>
      row(`annonce-${index}`, '2026-10-05T09:00:00.000Z'),
    )
    vi.spyOn(db, 'listRows')
      .mockResolvedValueOnce({ total: 501, rows: firstPage } as never)
      .mockResolvedValueOnce({
        total: 501,
        rows: [row('derniere', '2026-10-06T09:00:00.000Z')],
      } as never)

    const entries = await listSitemapListings(db, 'smodeal', now)

    expect(entries).toHaveLength(501)
    expect(db.listRows).toHaveBeenCalledTimes(2)
    const secondQueries = queriesOfCall(db, 1)
    expect(secondQueries).toContainEqual(expect.stringContaining('annonce-499'))
  })

  it('plafonne le nombre d’annonces listées', async () => {
    const db = new TablesDB(new Client())
    let call = 0
    vi.spyOn(db, 'listRows').mockImplementation(async () => {
      call += 1
      return {
        total: 100_000,
        rows: Array.from({ length: 500 }, (_, index) =>
          row(`annonce-${call}-${index}`, '2026-10-05T09:00:00.000Z'),
        ),
      } as never
    })

    const entries = await listSitemapListings(db, 'smodeal', now)

    expect(entries).toHaveLength(5000)
    expect(db.listRows).toHaveBeenCalledTimes(10)
  })

  it('se rabat sur la date de publication sans date de mise à jour', async () => {
    const db = new TablesDB(new Client())
    vi.spyOn(db, 'listRows').mockResolvedValue({
      total: 1,
      rows: [{ $id: 'annonce-1', publishedAt: '2026-10-01T00:00:00.000Z' }],
    } as never)

    expect(await listSitemapListings(db, 'smodeal', now)).toEqual([
      { id: 'annonce-1', lastmod: '2026-10-01T00:00:00.000Z' },
    ])
  })
})
