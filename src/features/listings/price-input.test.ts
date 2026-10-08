import { describe, expect, it } from 'vitest'
import { centsToPriceInput, priceInputToCents } from './price-input'

describe('prix saisi en euros', () => {
  it.each([
    ['25.50', 2550],
    ['0', 0],
    ['12,34', 1234],
    ['19.9', 1990],
    ['20000000', 2000000000],
    ['1 250,99', 125099],
    ['1\u00a0250', 125000],
    ['12\u202f000,5', 1200050],
  ])('convertit %s sans arrondi flottant', (input, expected) => {
    expect(priceInputToCents(input)).toBe(expected)
  })
  it.each([
    '',
    '-1',
    '1.001',
    '1e3',
    '20000000.01',
    'Infinity',
    '12 34',
    ' ,5',
  ])('refuse le prix invalide %s', (input) => {
    expect(() => priceInputToCents(input)).toThrow('prix')
  })
})

describe('prix existant affiché dans le champ', () => {
  it.each([
    [2500, '25'],
    [1250, '12,50'],
    [1999, '19,99'],
    [5, '0,05'],
    [0, '0'],
  ])('affiche %i centimes comme %s', (cents, expected) => {
    expect(centsToPriceInput(cents)).toBe(expected)
  })

  it('reste relisible par la conversion en centimes', () => {
    expect(priceInputToCents(centsToPriceInput(123_456))).toBe(123_456)
  })
})
