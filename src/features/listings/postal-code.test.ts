import { describe, expect, it } from 'vitest'
import { departmentFromPostalCode } from './postal-code'

describe('département déduit du code postal', () => {
  it.each([
    ['75011', '75'],
    ['01000', '01'],
    ['20000', '2A'],
    ['20190', '2A'],
    ['20200', '2B'],
    ['20600', '2B'],
    ['97400', '974'],
    ['98800', '988'],
  ])('déduit le département de %s', (postalCode, expected) => {
    expect(departmentFromPostalCode(postalCode)).toBe(expected)
  })

  it.each(['', '7501', '750111', 'abcde', '00100'])(
    'ne déduit rien de %s',
    (postalCode) => {
      expect(departmentFromPostalCode(postalCode)).toBeNull()
    },
  )
})
