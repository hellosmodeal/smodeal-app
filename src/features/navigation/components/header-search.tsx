import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { type FormEvent, useId } from 'react'
import { cn } from '@/lib/utils'

export function HeaderSearch({
  className,
  onSearch,
}: {
  className?: string
  onSearch?: () => void
}) {
  const navigate = useNavigate()
  const inputId = useId()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    onSearch?.()
    await navigate({ to: '/recherche', search: q ? { q } : {} })
  }

  return (
    <search className={cn('relative', className)}>
      <form onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          Rechercher une annonce
        </label>
        <Search
          className="absolute left-3 top-1/2 size-4 text-muted-foreground pointer-events-none -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id={inputId}
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder="Rechercher un vélo, un canapé…"
          className="w-full h-10 rounded-full border border-input outline-none py-2 pl-9 pr-4 text-sm bg-background transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
        />
      </form>
    </search>
  )
}
