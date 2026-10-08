export type Viewer = {
  id: string
  suspended: boolean
}

export type SellerContact = {
  ownerId: string
  displayConsent: boolean
}

export function canRevealPhone(
  viewer: Viewer | null,
  contact: SellerContact,
): boolean {
  if (!viewer || viewer.suspended) return false
  if (viewer.id === contact.ownerId) return true
  return contact.displayConsent
}

export function formatPhoneForDisplay(phone: string): string {
  const compact = phone.replace(/[\s.\-()]/g, '')
  if (/^0\d{9}$/.test(compact)) return compact.replace(/(\d{2})(?=\d)/g, '$1 ')
  const international = /^\+33([1-9])(\d{8})$/.exec(compact)
  if (international)
    return `+33 ${international[1]} ${international[2].replace(/(\d{2})(?=\d)/g, '$1 ')}`
  return phone.trim()
}
