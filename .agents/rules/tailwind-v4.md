---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
---

# Tailwind CSS 4

Scope: styles in `src/`.

- CSS-first configuration in `src/styles.css`: no `tailwind.config.*`. Tokens live in `:root`/`.dark` and are
  exposed as utilities through `@theme inline`.
- Use semantic tokens (`bg-background`, `text-muted-foreground`, `bg-primary`) before raw palette colors.
  Brand colors from `docs/identite-visuelle.md` become tokens once validated, not repeated one-off classes.
- Class order and canonical forms are enforced by `tailwind-canonical` (pre-commit fix, `pnpm lint:tailwind` in CI).
  Its `--dedup` is kept out of the check: 0.7.0 reports pure reorders as dedups and fights `--sort`.
- Merge conditional classes with `cn` from `@/lib/utils`.
- Preserve contrast, visible focus, responsive layout and `motion-safe`/`motion-reduce` preferences.
