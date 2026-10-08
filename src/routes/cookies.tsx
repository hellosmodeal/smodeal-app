import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/features/legal/components/legal-page'
import { cookiePolicy } from '@/features/legal/content'
import { legalPageHead } from '@/features/legal/head'
import { getSeoConfig } from '@/features/seo/functions'

export const Route = createFileRoute('/cookies')({
  loader: async () => ({ seo: await getSeoConfig() }),
  head: ({ loaderData }) => legalPageHead(cookiePolicy, loaderData?.seo),
  component: () => <LegalPage document={cookiePolicy} />,
})
