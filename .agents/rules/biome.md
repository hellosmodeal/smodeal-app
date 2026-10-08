---
paths:
  - "**/*.{js,ts,tsx,json,jsonc,css}"
  - "biome.json"
---

# Biome

Scope: JS, TS, JSON and CSS files. Biome replaces ESLint and Prettier; do not reintroduce them.

- `biome.json` is the source of truth: single quotes, no semicolons, 2 spaces, recommended lint preset,
  import organization on, Tailwind directives parsed in CSS.
- `pnpm format` (`biome check --write`) fixes; `pnpm lint` checks; CI runs `pnpm biome ci`.
- The pre-commit hook runs `biome check --write` on staged files and restages them.
- Only `src/routeTree.gen.ts` (generated) is excluded, plus gitignored paths via VCS integration.
  Keep ignores narrow; never exclude source to silence findings.
- For generated shadcn files in `src/components/ui/**` only: `noLabelWithoutControl` (the `Label` primitive
  receives `htmlFor` through props), `useSemanticElements`, `noArrayIndexKey` and `noDoubleEquals` are off,
  so regenerated components stay untouched. Any other exception is a local `// biome-ignore <rule>: <reason>`.
- Biome does not format Markdown: docs keep their hand-written layout.
- Do not mix a wholesale reformat with a feature change.
