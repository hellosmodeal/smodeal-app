import { createFileRoute } from '@tanstack/react-router'
import { handleGoogleSignInReturn } from '@/features/auth/google.server'

export const Route = createFileRoute('/connexion_/google/retour')({
  server: {
    handlers: {
      GET: ({ request }) => handleGoogleSignInReturn(request),
    },
  },
})
