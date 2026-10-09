import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { AllCategoriesIcon, navigationCategories } from '../category-icons'
import type { SearchCriteria } from '../rules'

const tabs = [
  { slug: undefined, label: 'Tout', Icon: AllCategoriesIcon },
  ...navigationCategories,
]

/**
 * Category links to the search page. Without criteria (home page), no tab is
 * marked as current and each link opens its category alone.
 */
export function CategoryTabs({ criteria }: { criteria?: SearchCriteria }) {
  return (
    <nav
      aria-label="Catégories"
      className="overflow-x-auto flex gap-3 border-b border-border sm:justify-between [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
    >
      {tabs.map(({ slug, label, Icon }) => {
        const active = criteria !== undefined && criteria.categorie === slug
        return (
          <Link
            activeOptions={{ exact: true }}
            key={label}
            to="/recherche"
            search={
              criteria
                ? { ...criteria, categorie: slug, page: undefined }
                : slug
                  ? { categorie: slug }
                  : {}
            }
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-t-md border-b-2 px-2 py-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
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
