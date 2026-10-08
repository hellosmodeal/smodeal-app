export function RoutePending() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement de la page…</span>
      <div
        aria-hidden="true"
        className="overflow-hidden fixed inset-x-0 top-0 z-50 h-0.5 bg-brand-surface"
      >
        <div className="h-full w-1/3 bg-primary motion-reduce:w-full motion-reduce:opacity-60 motion-safe:animate-route-progress" />
      </div>
    </div>
  )
}
