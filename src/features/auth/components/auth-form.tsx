import type { FormEvent } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthResult } from '../functions'

type Field = {
  name: string
  label: string
  type: string
  autoComplete: string
}

export function AuthForm({
  title,
  description,
  fields,
  submitLabel,
  onSubmit,
}: {
  title: string
  description: string
  fields: Array<Field>
  submitLabel: string
  onSubmit: (values: Record<string, string>) => Promise<AuthResult>
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        String(value),
      ]),
    )
    try {
      const result = await onSubmit(values)
      if (!result.ok) setError(result.message)
    } catch {
      setError('Vérifiez les informations saisies.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required
              />
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
