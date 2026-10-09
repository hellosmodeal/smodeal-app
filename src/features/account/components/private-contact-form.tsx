import { useRouter } from '@tanstack/react-router'
import { Loader2, ShieldCheck } from 'lucide-react'
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
import {
  formatPhoneForDisplay,
  PHONE_CONSENT_HINT,
  PHONE_CONSENT_LABEL,
} from '@/features/contact/rules'
import { updatePrivateContact } from '../functions'
import { privateContactSchema } from '../rules'
import { FormFeedback } from './form-feedback'
import { useAccountForm } from './use-account-form'

export function PrivateContactForm({
  contact,
}: {
  contact: { phone: string; displayConsent: boolean } | null
}) {
  const router = useRouter()
  const form = useAccountForm({
    schema: privateContactSchema,
    read: (element) => {
      const data = new FormData(element)
      return {
        phone: String(data.get('phone') ?? ''),
        displayConsent: data.get('displayConsent') === 'on',
      }
    },
    submit: async (data) => {
      const result = await updatePrivateContact({ data })
      if (result.ok) await router.invalidate()
      return result
    },
    successMessage: 'Coordonnées enregistrées.',
  })
  const phoneError = form.fieldErrors.phone
  const consentError = form.fieldErrors.displayConsent

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">
            Coordonnées privées
          </h2>
        </CardTitle>
        <CardDescription>
          Votre numéro n’est jamais affiché publiquement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.onSubmit} className="grid gap-4">
          <Field data-invalid={Boolean(phoneError)}>
            <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={
                contact ? formatPhoneForDisplay(contact.phone) : undefined
              }
              placeholder="06 12 34 56 78"
              required
              aria-invalid={Boolean(phoneError)}
              aria-describedby={
                phoneError
                  ? 'phone-description phone-error'
                  : 'phone-description'
              }
              className="h-10 sm:max-w-64"
            />
            <FieldDescription id="phone-description">
              Numéro français (06 12 34 56 78) ou international (+33 6 12 34 56
              78).
            </FieldDescription>
            <FieldError id="phone-error">{phoneError}</FieldError>
          </Field>
          <label
            htmlFor="display-consent"
            className="flex gap-3 items-start rounded-lg border border-border p-4 text-sm bg-brand-surface cursor-pointer has-checked:border-primary"
          >
            <input
              id="display-consent"
              name="displayConsent"
              type="checkbox"
              defaultChecked={contact?.displayConsent ?? false}
              aria-invalid={Boolean(consentError)}
              aria-describedby={
                consentError
                  ? 'display-consent-description display-consent-error'
                  : 'display-consent-description'
              }
              className="shrink-0 size-4 mt-0.5 accent-primary"
            />
            <span className="grid gap-1">
              <span className="flex gap-1.5 items-center font-medium">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                {PHONE_CONSENT_LABEL}
              </span>
              <span
                id="display-consent-description"
                className="text-muted-foreground"
              >
                {PHONE_CONSENT_HINT}
              </span>
            </span>
          </label>
          <FieldError id="display-consent-error">{consentError}</FieldError>
          <FormFeedback error={form.error} success={form.success} />
          <Button
            type="submit"
            disabled={form.pending}
            className="w-full sm:w-fit"
          >
            {form.pending && <Loader2 className="animate-spin" aria-hidden />}
            {form.pending ? 'Enregistrement…' : 'Enregistrer mes coordonnées'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
