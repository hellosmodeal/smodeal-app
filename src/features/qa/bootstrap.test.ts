import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('refuse une configuration distante avant toute création du schéma de recette', () => {
  const directory = mkdtempSync(join(tmpdir(), 'smodeal-schema-guard-'))
  try {
    const env = join(directory, 'qa.local')
    const config = join(directory, 'schema.json')
    writeFileSync(
      env,
      'APPWRITE_ENDPOINT=https://example.invalid/v1\nAPPWRITE_PROJECT_ID=smodeal-qa\nAPPWRITE_API_KEY=fictitious\n',
      { mode: 0o600 },
    )
    writeFileSync(
      config,
      JSON.stringify({ tablesDB: [], tables: [], buckets: [] }),
    )
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(
          new URL('../../../infra/qa/push-schema.mjs', import.meta.url),
        ),
        env,
        config,
      ],
      { encoding: 'utf8' },
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Le schéma de recette exige Appwrite local')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
