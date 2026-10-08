import { Link } from '@tanstack/react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'

export function InvalidLinkNotice({
  message,
  action,
}: {
  message: string
  action: 'new-recovery-link' | 'account'
}) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {action === 'new-recovery-link' ? (
        <Link to="/mot-de-passe-oublie" className={buttonVariants()}>
          Demander un nouveau lien
        </Link>
      ) : (
        <Link to="/compte" className={buttonVariants()}>
          Aller à mon compte
        </Link>
      )}
    </div>
  )
}
