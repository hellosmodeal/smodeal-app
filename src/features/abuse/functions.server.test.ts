import { describe, expect, it, vi } from 'vitest'
import { RateLimitError } from './abuse.server'
import { consumeAnonymousSubjects } from './functions.server'

describe('les limites anonymes', () => {
  it('n’entame pas le quota global lorsqu’un seau est déjà à sa limite', async () => {
    const consumeSubject = vi.fn(async (subject: string) => {
      if (subject !== 'anonymous:global') throw new RateLimitError(60)
    })

    await expect(
      consumeAnonymousSubjects(
        'auth_signin',
        'membre@smodeal.test',
        'secret-de-test',
        consumeSubject,
      ),
    ).rejects.toBeInstanceOf(RateLimitError)

    expect(consumeSubject).toHaveBeenCalledTimes(1)
    expect(consumeSubject).not.toHaveBeenCalledWith(
      'anonymous:global',
      expect.anything(),
    )
  })
})
