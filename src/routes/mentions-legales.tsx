import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/features/legal/components/legal-page'
import { legalNotice } from '@/features/legal/content'
import { legalPageHead } from '@/features/legal/head'
import { getSeoConfig } from '@/features/seo/functions'

export const Route = createFileRoute('/mentions-legales')({
  loader: async () => ({ seo: await getSeoConfig() }),
  head: ({ loaderData }) => legalPageHead(legalNotice, loaderData?.seo),
  component: () => <LegalPage document={legalNotice} />,
})
