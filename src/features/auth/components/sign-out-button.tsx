import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { signOut } from '../functions'

export function SignOutButton() {
  const signOutFn = useServerFn(signOut)

  return (
    <Button variant="ghost" size="sm" onClick={() => signOutFn()}>
      Déconnexion
    </Button>
  )
}
