import {
  createFileRoute,
  Link,
  redirect as routeRedirect,
  useRouter,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/features/auth/components/auth-card'
import { AuthForm } from '@/features/auth/components/auth-form'
import { EmailVerificationButton } from '@/features/auth/components/email-verification-button'
import { signUp } from '@/features/auth/functions'
import {
  authRedirectSearchSchema,
  signedInAuthPageRedirect,
  signUpSchema,
} from '@/features/auth/rules'

export const Route = createFileRoute('/inscription')({
  validateSearch: authRedirectSearchSchema,
  beforeLoad: ({ context, cause, search }) => {
    const target = signedInAuthPageRedirect({
      signedIn: Boolean(context.user),
      cause,
      redirect: search.redirect,
    })
    if (target) throw routeRedirect({ href: target })
  },
  head: () => ({ meta: [{ title: 'Inscription — Smodeal' }] }),
  component: SignUpPage,
})

type Registration = { email: string; verificationSent: boolean }

function SignUpPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()
  const signUpFn = useServerFn(signUp)
  const [registration, setRegistration] = useState<Registration | null>(null)

  if (registration) {
    return <CheckEmail registration={registration} target={redirect} />
  }

  return (
    <AuthForm
      title="Inscription"
      description="Créez votre compte pour publier et contacter les vendeurs."
      submitLabel="Créer mon compte"
      pendingLabel="Création…"
      schema={signUpSchema}
      fields={[
        {
          name: 'name',
          label: 'Pseudonyme',
          type: 'text',
          autoComplete: 'nickname',
          minLength: 2,
          maxLength: 40,
        },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        {
          name: 'password',
          label: 'Mot de passe (8 caractères minimum)',
          type: 'password',
          autoComplete: 'new-password',
          minLength: 8,
          maxLength: 256,
        },
      ]}
      checkbox={{
        name: 'acceptTerms',
        label: (
          <>
            J’accepte les{' '}
            <a
              href="/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline text-primary"
            >
              conditions générales d’utilisation
            </a>{' '}
            et la{' '}
            <a
              href="/confidentialite"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline text-primary"
            >
              politique de confidentialité
            </a>
          </>
        ),
      }}
      onSubmit={async (values) => {
        const result = await signUpFn({
          data: {
            name: values.name,
            email: values.email,
            password: values.password,
            acceptTerms: values.acceptTerms === 'on',
          },
        })
        if (!result.ok) return result
        await router.invalidate()
        setRegistration({
          email: values.email,
          verificationSent: result.verificationSent,
        })
        return { ok: true }
      }}
    >
      <p className="text-sm text-muted-foreground">
        Déjà inscrit ?{' '}
        <Link
          to="/connexion"
          search={{ redirect }}
          className="font-medium underline text-primary"
        >
          Se connecter
        </Link>
      </p>
    </AuthForm>
  )
}

function CheckEmail({
  registration,
  target,
}: {
  registration: Registration
  target: string | undefined
}) {
  const router = useRouter()
  return (
    <AuthCard
      title="Vérifiez vos emails"
      description={
        registration.verificationSent
          ? `Un lien de vérification vient d’être envoyé à ${registration.email}. Ouvrez-le pour pouvoir publier une annonce.`
          : 'Votre compte est créé. Vérifiez votre adresse email pour pouvoir publier une annonce.'
      }
    >
      {!registration.verificationSent && (
        <Alert variant="destructive">
          <AlertDescription>
            Le lien de vérification n’a pas pu être envoyé. Réessayez ci-dessous
            ou plus tard depuis votre compte.
          </AlertDescription>
        </Alert>
      )}
      <EmailVerificationButton
        label={
          registration.verificationSent
            ? 'Renvoyer l’email de vérification'
            : 'Envoyer l’email de vérification'
        }
        variant={registration.verificationSent ? 'outline' : 'default'}
      />
      <Button
        type="button"
        className="w-full"
        onClick={() => router.navigate({ href: target ?? '/compte' })}
      >
        Continuer
      </Button>
    </AuthCard>
  )
}
