import { CircleCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function FormFeedback({
  error,
  success,
}: {
  error: string | null
  success: string | null
}) {
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  if (success)
    return (
      <Alert role="status">
        <CircleCheck aria-hidden />
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    )
  return null
}
