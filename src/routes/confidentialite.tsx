import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/features/legal/components/legal-page'
import { privacyPolicy } from '@/features/legal/content'
import { legalPageHead } from '@/features/legal/head'
import { getSeoConfig } from '@/features/seo/functions'

export const Route = createFileRoute('/confidentialite')({
  loader: async () => ({ seo: await getSeoConfig() }),
  head: ({ loaderData }) => legalPageHead(privacyPolicy, loaderData?.seo),
  component: () => <LegalPage document={privacyPolicy} />,
})
