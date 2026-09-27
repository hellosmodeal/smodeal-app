---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Zod 4

Scope: TypeScript code using Zod.

- Validate every server function input with `createServerFn(...).inputValidator(schema)`; the client is untrusted.
- Environment is validated by `parseServerEnv` in `src/server/env.server.ts`; add new variables to its schema
  and to `.env.example` (no value).
- Use Zod 4 top-level formats (`z.url()`, `z.email()`), not deprecated `z.string().url()` chains.
- `parse` when invalid input must stop execution; `safeParse` when the caller renders the failure.
- Derive types with `z.infer` when a schema is the contract.
- Never accept an owner/seller/admin identifier from input: identity comes from the session.
- User-facing validation messages are in French.
