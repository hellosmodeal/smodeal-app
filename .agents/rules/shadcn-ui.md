---
paths:
  - "src/components/**"
  - "src/features/**/components/**"
  - "components.json"
---

# shadcn/ui (base-nova, Base UI)

Scope: UI components.

- Style `base-nova` on Base UI (`@base-ui/react`), not Radix: compose with the `render` prop, not `asChild`.
- Add components with `pnpm dlx shadcn@latest add <name>`; they land in `src/components/ui` and are project-owned.
- Customize through `cva` variants in the component, not ad-hoc overrides at every call site.
- `cn` comes from `@/lib/utils` (re-export of the `cn` package).
- Icons: `lucide-react`.
- Feature-specific UI lives in `src/features/<domain>/components/`, not in `components/ui`.
- Preserve semantic HTML, keyboard interaction, focus handling, labels and accessible names.
