export function priceInputToCents(input: string): number {
  const value = input.trim()
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(value))
    throw new Error('Indiquez un prix en euros avec au maximum deux décimales.')
  const [euros, decimals = ''] = value.replace(',', '.').split('.')
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, '0'))
  if (cents > 2_000_000_000)
    throw new Error('Le prix dépasse le montant maximum autorisé.')
  return cents
}
