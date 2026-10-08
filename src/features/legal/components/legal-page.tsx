import { isLegalTodo, type LegalBlock, type LegalDocument } from '../content'

function LegalText({ block }: { block: LegalBlock }) {
  return block.map((part, index) =>
    isLegalTodo(part) ? (
      <mark
        // biome-ignore lint/suspicious/noArrayIndexKey: static content, order never changes
        key={index}
        className="rounded-sm px-1 font-medium bg-accent text-accent-foreground"
      >
        À compléter : {part.todo}
      </mark>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: static content, order never changes
      <span key={index}>{part}</span>
    ),
  )
}

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <article className="max-w-3xl">
      <h1 className="page-title">{document.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : <LegalText block={document.updatedAt} />
      </p>
      <div className="flex gap-8 flex-col mt-8">
        {document.sections.map((section) => (
          <section key={section.heading} className="flex gap-3 flex-col">
            <h2 className="font-heading text-xl font-semibold">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static content, order never changes
              <p key={index} className="leading-relaxed">
                <LegalText block={paragraph} />
              </p>
            ))}
            {section.items && (
              <ul className="flex gap-1.5 flex-col pl-5 leading-relaxed list-disc">
                {section.items.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static content, order never changes
                  <li key={index}>
                    <LegalText block={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
