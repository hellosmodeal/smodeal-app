import { Autocomplete } from '@base-ui/react/autocomplete'
import { Loader2 } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'

export function LocationAutocomplete<Item>({
  value,
  onValueChange,
  items,
  itemKey,
  itemToString,
  renderItem,
  onSelect,
  loading = false,
  emptyText,
  openOnInputClick = false,
  input,
}: {
  value: string
  onValueChange: (value: string) => void
  items: readonly Item[]
  itemKey: (item: Item) => string
  itemToString: (item: Item) => string
  renderItem: (item: Item) => ReactNode
  onSelect?: (item: Item) => void
  loading?: boolean
  emptyText?: string
  openOnInputClick?: boolean
  input: ReactElement
}) {
  return (
    <Autocomplete.Root
      items={items}
      mode="none"
      value={value}
      onValueChange={(next) => onValueChange(next)}
      itemToStringValue={itemToString}
      openOnInputClick={openOnInputClick}
    >
      <Autocomplete.Input render={input} />
      <Autocomplete.Portal>
        <Autocomplete.Positioner
          sideOffset={6}
          align="start"
          className="z-50 isolate"
        >
          <Autocomplete.Popup className="overflow-hidden w-(--anchor-width) min-w-64 max-w-(--available-width) max-h-(--available-height) rounded-lg ring-1 ring-foreground/10 bg-popover text-popover-foreground shadow-md duration-100 origin-(--transform-origin) data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95">
            <Autocomplete.Status className="flex gap-2 items-center py-2 px-3 text-sm text-muted-foreground empty:hidden">
              {loading && (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Recherche…
                </>
              )}
            </Autocomplete.Status>
            {!loading && emptyText && (
              <Autocomplete.Empty className="py-2 px-3 text-sm text-muted-foreground empty:hidden">
                {emptyText}
              </Autocomplete.Empty>
            )}
            <Autocomplete.List className="overflow-y-auto overscroll-contain max-h-72 p-1 scroll-py-1 data-empty:p-0">
              {(item: Item) => (
                <Autocomplete.Item
                  key={itemKey(item)}
                  value={item}
                  onClick={() => onSelect?.(item)}
                  className="flex gap-2 items-center rounded-md outline-none py-1.5 px-2 text-sm cursor-default select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {renderItem(item)}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
