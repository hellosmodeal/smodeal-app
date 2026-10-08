import {
  buildPageHead,
  type PageHead,
  type SeoConfig,
} from '@/features/seo/rules'
import { hasPendingLegalFields, type LegalDocument } from './content'

export function legalPageHead(
  document: LegalDocument,
  seo: SeoConfig | undefined,
): PageHead {
  return buildPageHead(
    {
      title: `${document.title} — Smodeal`,
      description: document.description,
      path: document.path,
      imageAlt: 'Smodeal, petites annonces entre particuliers',
      noindex: hasPendingLegalFields(document),
    },
    seo,
  )
}
