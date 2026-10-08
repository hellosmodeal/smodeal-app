import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'

const resetSearchSchema = z.object({
  userId: z.string().optional(),
  secret: z.string().optional(),
})

export const Route = createFileRoute('/reinitialiser-mot-de-passe')({
  validateSearch: resetSearchSchema,
  head: () => ({
    meta: [
      { title: 'Réinitialiser le mot de passe — Smodeal' },
      { name: 'referrer', content: 'no-referrer' },
    ],
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { secret, userId } = Route.useSearch()

  return <ResetPasswordForm userId={userId} secret={secret} />
}
