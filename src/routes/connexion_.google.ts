import { createFileRoute } from '@tanstack/react-router'
import { handleGoogleSignInStart } from '@/features/auth/google.server'

export const Route = createFileRoute('/connexion_/google')({
  server: {
    handlers: {
      GET: ({ request }) => handleGoogleSignInStart(request),
    },
  },
})
