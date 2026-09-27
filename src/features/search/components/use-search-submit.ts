import { useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { parseSearchCriteria } from '../rules'

export function useSearchSubmit(): (event: FormEvent<HTMLFormElement>) => void {
  const navigate = useNavigate()

  return (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    void navigate({ to: '/recherche', search: parseSearchCriteria(values) })
  }
}
