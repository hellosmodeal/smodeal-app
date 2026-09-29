import { describe, expect, it } from 'vitest'
import { priceInputToCents } from './price-input'

describe('prix saisi en euros', () => {
  it.each([
    ['25.50', 2550],
    ['0', 0],
    ['12,34', 1234],
    ['19.9', 1990],
    ['20000000', 2000000000],
  ])('convertit %s sans arrondi flottant', (input, expected) => {
    expect(priceInputToCents(input)).toBe(expected)
  })
  it.each(['', '-1', '1.001', '1e3', '20000000.01', 'Infinity'])(
    'refuse le prix invalide %s',
    (input) => {
      expect(() => priceInputToCents(input)).toThrow('prix')
    },
  )
})
