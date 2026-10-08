import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from '../functions'

export function SignOutButton({
  variant = 'ghost',
  size = 'sm',
}: {
  variant?: 'ghost' | 'outline'
  size?: 'sm' | 'default'
}) {
  const signOutFn = useServerFn(signOut)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      await signOutFn()
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? 'Déconnexion…' : 'Déconnexion'}
    </Button>
  )
}
