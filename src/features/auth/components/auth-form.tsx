import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import type { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authFieldErrors } from '../rules'
import { AuthCard } from './auth-card'

type AuthField = {
  name: string
  label: string
  type: string
  autoComplete: string
  minLength?: number
  maxLength?: number
}

type AuthCheckbox = {
  name: string
  label: ReactNode
}

export function AuthForm({
  title,
  description,
  fields,
  checkbox,
  schema,
  submitLabel,
  pendingLabel,
  onSubmit,
  children,
}: {
  title: string
  description: string
  fields: Array<AuthField>
  checkbox?: AuthCheckbox
  schema: z.ZodType
  submitLabel: string
  pendingLabel: string
  onSubmit: (
    values: Record<string, string>,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  children?: ReactNode
}) {
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  function clearFieldError(name: string) {
    setFieldErrors(({ [name]: _cleared, ...rest }) => rest)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        String(value),
      ]),
    )
    const errors = authFieldErrors(schema, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setPending(true)
    try {
      const result = await onSubmit(values)
      if (!result.ok) setError(result.message)
    } catch {
      setError('Service indisponible pour le moment. Réessayez plus tard.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard title={title} description={description}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {fields.map((field) => {
          const fieldError = fieldErrors[field.name]
          return (
            <Field key={field.name} data-invalid={Boolean(fieldError)}>
              <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                minLength={field.minLength}
                maxLength={field.maxLength}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={
                  fieldError ? `${field.name}-error` : undefined
                }
                required
              />
              <FieldError id={`${field.name}-error`}>{fieldError}</FieldError>
            </Field>
          )
        })}
        {checkbox && (
          <div className="grid gap-2">
            <Field
              orientation="horizontal"
              data-invalid={Boolean(fieldErrors[checkbox.name])}
              className="items-start"
            >
              <input
                id={checkbox.name}
                name={checkbox.name}
                type="checkbox"
                aria-invalid={Boolean(fieldErrors[checkbox.name])}
                aria-describedby={
                  fieldErrors[checkbox.name]
                    ? `${checkbox.name}-error`
                    : undefined
                }
                onChange={(event) => {
                  if (event.currentTarget.checked)
                    clearFieldError(checkbox.name)
                }}
                required
                className="shrink-0 size-4 rounded outline-none mt-0.5 accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:outline-2 aria-invalid:outline-destructive"
              />
              <FieldLabel
                htmlFor={checkbox.name}
                className="block min-w-0 font-normal leading-snug"
              >
                {checkbox.label}
              </FieldLabel>
            </Field>
            <FieldError id={`${checkbox.name}-error`} className="pl-6">
              {fieldErrors[checkbox.name]}
            </FieldError>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </form>
      {children}
    </AuthCard>
  )
}
