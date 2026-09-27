import { Link } from '@tanstack/react-router'
import {
  Baby,
  Bike,
  Grid2X2,
  House,
  Laptop,
  Leaf,
  type LucideIcon,
  Shirt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SearchCriteria, searchCategories } from '../rules'

const categoryIcons: Record<string, LucideIcon> = {
  maison: House,
  multimedia: Laptop,
  mode: Shirt,
  loisirs: Bike,
  enfants: Baby,
  jardin: Leaf,
}

const tabs = [
  { slug: undefined, label: 'Tout', Icon: Grid2X2 },
  ...searchCategories.map((category) => ({
    slug: category.slug,
    label: category.label,
    Icon: categoryIcons[category.slug] ?? Grid2X2,
  })),
]

export function CategoryTabs({ criteria }: { criteria: SearchCriteria }) {
  return (
    <nav
      aria-label="Catégories"
      className="overflow-x-auto flex gap-3 border-b border-border sm:justify-between"
    >
      {tabs.map(({ slug, label, Icon }) => {
        const active = criteria.categorie === slug
        return (
          <Link
            key={label}
            to="/recherche"
            search={{ ...criteria, categorie: slug, page: undefined }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand',
              active
                ? 'border-brand text-brand-dark'
                : 'border-transparent hover:text-brand-dark',
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
