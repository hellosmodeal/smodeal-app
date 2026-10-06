export function departmentFromPostalCode(postalCode: string): string | null {
  if (!/^\d{5}$/.test(postalCode) || postalCode.startsWith('00')) return null
  if (postalCode.startsWith('20'))
    return Number(postalCode.slice(2, 3)) < 2 ? '2A' : '2B'
  if (postalCode.startsWith('97') || postalCode.startsWith('98'))
    return postalCode.slice(0, 3)
  return postalCode.slice(0, 2)
}
