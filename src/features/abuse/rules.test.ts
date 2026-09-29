import { describe, expect, it } from 'vitest'
import {
  ANONYMOUS_BUCKET_COUNT,
  rateLimitPolicy,
  rateLimitWindowStart,
} from './rules'

describe('les politiques anti-abus', () => {
  it('applique les limites initiales documentées', () => {
    expect(rateLimitPolicy('auth_signin')).toMatchObject({
      limit: 10,
      windowMs: 15 * 60_000,
    })
    expect(rateLimitPolicy('auth_signup')).toMatchObject({
      limit: 5,
      windowMs: 60 * 60_000,
    })
    expect(rateLimitPolicy('listing_publish')).toMatchObject({
      limit: 10,
      windowMs: 60 * 60_000,
    })
    expect(rateLimitPolicy('contact_reveal')).toMatchObject({
      limit: 30,
      windowMs: 10 * 60_000,
    })
    expect(rateLimitPolicy('report_submit')).toMatchObject({
      limit: 10,
      windowMs: 60 * 60_000,
    })
  })

  it('aligne les fenêtres fixes sur leur début', () => {
    expect(
      rateLimitWindowStart(new Date('2026-09-28T10:14:59.000Z'), 15 * 60_000),
    ).toBe('2026-09-28T10:00:00.000Z')
  })

  it('borne les seaux anonymes', () => {
    expect(ANONYMOUS_BUCKET_COUNT).toBe(4096)
  })
})
