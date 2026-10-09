export function memberInitials(name: string): string {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase('fr-FR') ?? '')
    .join('')
  return initials || '?'
}
