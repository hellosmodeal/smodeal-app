import { createFileRoute } from '@tanstack/react-router'
import { RecoveryRequestForm } from '@/features/auth/components/recovery-request-form'

export const Route = createFileRoute('/mot-de-passe-oublie')({
  head: () => ({ meta: [{ title: 'Mot de passe oublié — Smodeal' }] }),
  component: RecoveryRequestPage,
})

function RecoveryRequestPage() {
  return <RecoveryRequestForm />
}
