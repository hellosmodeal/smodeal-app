import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AuthForm } from '@/features/auth/components/auth-form'
import { signUp } from '@/features/auth/functions'

export const Route = createFileRoute('/inscription')({
  head: () => ({ meta: [{ title: 'Inscription — Smodeal' }] }),
  component: SignUpPage,
})

function SignUpPage() {
  const router = useRouter()
  const signUpFn = useServerFn(signUp)

  return (
    <AuthForm
      title="Inscription"
      description="Créez votre compte pour publier et contacter les vendeurs."
      submitLabel="Créer mon compte"
      fields={[
        {
          name: 'name',
          label: 'Pseudonyme',
          type: 'text',
          autoComplete: 'nickname',
        },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        {
          name: 'password',
          label: 'Mot de passe (8 caractères minimum)',
          type: 'password',
          autoComplete: 'new-password',
        },
      ]}
      onSubmit={async (values) => {
        const result = await signUpFn({
          data: {
            name: values.name,
            email: values.email,
            password: values.password,
          },
        })
        if (result.ok) {
          await router.invalidate()
          await router.navigate({ to: '/compte' })
        }
        return result
      }}
    />
  )
}
