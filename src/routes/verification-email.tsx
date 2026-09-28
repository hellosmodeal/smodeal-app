import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { VerifyEmailResult } from '@/features/auth/components/verify-email-result'

const verificationSearchSchema = z.object({
  userId: z.string().optional(),
  secret: z.string().optional(),
})

export const Route = createFileRoute('/verification-email')({
  validateSearch: verificationSearchSchema,
  head: () => ({
    meta: [
      { title: 'Vérification de votre email — Smodeal' },
      { name: 'referrer', content: 'no-referrer' },
    ],
  }),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { secret, userId } = Route.useSearch()

  return <VerifyEmailResult userId={userId} secret={secret} />
}
