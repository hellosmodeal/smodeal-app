import { useRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updatePublicProfile } from '../functions'
import { publicProfileSchema } from '../rules'
import { FormFeedback } from './form-feedback'
import { useAccountForm } from './use-account-form'

export function PublicProfileForm({ pseudonym }: { pseudonym: string }) {
  const router = useRouter()
  const form = useAccountForm({
    schema: publicProfileSchema,
    read: (element) => ({
      pseudonym: String(new FormData(element).get('pseudonym') ?? ''),
    }),
    submit: async (data) => {
      const result = await updatePublicProfile({ data })
      if (result.ok) await router.invalidate()
      return result
    },
    successMessage: 'Pseudonyme enregistré.',
  })
  const error = form.fieldErrors.pseudonym

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Profil public</h2>
        </CardTitle>
        <CardDescription>
          Ce nom est visible par les autres membres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.onSubmit} className="grid gap-4">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="pseudonym">Pseudonyme</FieldLabel>
            <Input
              id="pseudonym"
              name="pseudonym"
              autoComplete="nickname"
              defaultValue={pseudonym}
              minLength={2}
              maxLength={40}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? 'pseudonym-description pseudonym-error'
                  : 'pseudonym-description'
              }
              className="h-10 sm:max-w-80"
            />
            <FieldDescription id="pseudonym-description">
              Entre 2 et 40 caractères. Évitez votre nom complet.
            </FieldDescription>
            <FieldError id="pseudonym-error">{error}</FieldError>
          </Field>
          <FormFeedback error={form.error} success={form.success} />
          <Button
            type="submit"
            disabled={form.pending}
            className="w-full sm:w-fit"
          >
            {form.pending && <Loader2 className="animate-spin" aria-hidden />}
            {form.pending ? 'Enregistrement…' : 'Enregistrer le pseudonyme'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
