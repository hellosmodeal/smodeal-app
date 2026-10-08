/**
 * Contenu des pages légales. Chaque `todo(...)` marque une information que l'éditeur doit fournir
 * ou valider (TODO) : tant qu'il en reste, la page est servie en `noindex`.
 */

export type LegalTodo = {
  /** Information attendue, affichée « À compléter » sur la page. */
  todo: string
  /** Valeur provisoire utilisable ailleurs (pied de page), jamais présentée comme validée. */
  placeholder?: string
}

export type LegalInline = string | LegalTodo

/** Un paragraphe ou un élément de liste : une suite de fragments de texte et de champs à compléter. */
export type LegalBlock = LegalInline[]

type LegalSection = {
  heading: string
  paragraphs: LegalBlock[]
  items?: LegalBlock[]
}

export type LegalDocument = {
  path: string
  title: string
  description: string
  updatedAt: LegalBlock
  sections: LegalSection[]
}

export function todo(label: string, placeholder?: string): LegalTodo {
  return placeholder ? { todo: label, placeholder } : { todo: label }
}

export function isLegalTodo(value: LegalInline): value is LegalTodo {
  return typeof value !== 'string'
}

export function hasPendingLegalFields(document: LegalDocument): boolean {
  const blocks = [
    document.updatedAt,
    ...document.sections.flatMap((section) => [
      ...section.paragraphs,
      ...(section.items ?? []),
    ]),
  ]
  return blocks.some((block) => block.some(isLegalTodo))
}

/** TODO : adresse de contact à confirmer par l'éditeur avant ouverture. */
export const contactEmail = todo(
  'adresse email de contact',
  'contact@smodeal.fr',
)

const publisherName = todo('raison sociale ou nom de l’éditeur')
const lastReview = todo('date de dernière validation juridique')

export const legalNotice: LegalDocument = {
  path: '/mentions-legales',
  title: 'Mentions légales',
  description:
    'Éditeur, directeur de la publication, hébergeur et contact du site Smodeal.',
  updatedAt: [lastReview],
  sections: [
    {
      heading: 'Éditeur du site',
      paragraphs: [
        [
          'Le site Smodeal, service de petites annonces entre particuliers en France, est édité par ',
          publisherName,
          '.',
        ],
      ],
      items: [
        ['Forme juridique et capital : ', todo('forme juridique et capital')],
        ['Siège social : ', todo('adresse du siège social')],
        ['SIREN : ', todo('numéro SIREN')],
        ['RCS : ', todo('ville d’immatriculation au RCS')],
        ['TVA intracommunautaire : ', todo('numéro de TVA, le cas échéant')],
        ['Email : ', contactEmail],
      ],
    },
    {
      heading: 'Directeur de la publication',
      paragraphs: [
        [
          'Directeur ou directrice de la publication : ',
          todo('nom du directeur de la publication'),
          '.',
        ],
      ],
    },
    {
      heading: 'Hébergement',
      paragraphs: [
        [
          'Le site et ses données sont hébergés sur Appwrite Cloud (Appwrite Sites, base de données et stockage), dans la région de Francfort (Allemagne).',
        ],
      ],
      items: [
        ['Hébergeur : ', todo('raison sociale de l’hébergeur Appwrite')],
        ['Adresse : ', todo('adresse postale de l’hébergeur')],
        ['Contact : ', todo('téléphone ou contact de l’hébergeur')],
      ],
    },
    {
      heading: 'Point de contact (règlement sur les services numériques)',
      paragraphs: [
        [
          'Conformément au règlement (UE) 2022/2065 sur les services numériques, les autorités et les utilisateurs peuvent joindre Smodeal à l’adresse suivante, en français : ',
          todo('point de contact unique DSA (email dédié)'),
          '.',
        ],
        [
          'Pour signaler une annonce manifestement illicite, utilisez le bouton « Signaler » présent sur chaque annonce. Un signalement motivé est examiné par la modération, qui peut retirer l’annonce.',
        ],
        [
          'Information de l’auteur et voies de recours : ',
          todo(
            'modalités d’information motivée et de recours contre une décision de modération',
          ),
          '.',
        ],
        [
          'Signalement hors du site (sans compte) : ',
          todo('procédure de signalement de contenu illicite sans compte'),
          '.',
        ],
      ],
    },
    {
      heading: 'Propriété intellectuelle',
      paragraphs: [
        [
          'La marque Smodeal, son logo et la structure du site sont protégés. Les annonces et photos restent la propriété de leurs auteurs, qui concèdent à Smodeal le droit de les afficher pour la durée de diffusion de l’annonce.',
        ],
      ],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  path: '/cgu',
  title: 'Conditions générales d’utilisation',
  description:
    'Règles de publication, durée des annonces, modération et suspension des comptes sur Smodeal.',
  updatedAt: [lastReview],
  sections: [
    {
      heading: 'Objet du service',
      paragraphs: [
        [
          'Smodeal permet à des particuliers résidant en France de publier, rechercher et consulter des petites annonces, puis de contacter le vendeur. Smodeal n’est pas partie aux échanges : le prix, le paiement et la remise du bien sont convenus directement entre l’acheteur et le vendeur.',
        ],
        ['Éditeur du service : ', publisherName, '.'],
      ],
    },
    {
      heading: 'Compte membre',
      paragraphs: [
        [
          'La publication d’une annonce et l’accès aux coordonnées d’un vendeur nécessitent un compte. L’adresse email doit être vérifiée avant toute publication, et un numéro de téléphone est demandé pour être contacté. Vous êtes responsable de la confidentialité de votre mot de passe et des informations que vous publiez.',
        ],
      ],
    },
    {
      heading: 'Règles de publication',
      paragraphs: [
        [
          'Une annonce décrit un seul bien réel, que vous possédez et êtes en droit de vendre, avec un titre, une description, une catégorie, un état, un prix en euros, une localisation en France et jusqu’à cinq photos du bien. Sont interdits notamment :',
        ],
      ],
      items: [
        [
          'les biens dont la vente est illégale ou réglementée : armes, munitions, stupéfiants, médicaments, produits contrefaits ou volés, animaux, tabac et alcool ;',
        ],
        [
          'les contenus haineux, violents, à caractère sexuel ou portant atteinte aux droits d’un tiers (photos non autorisées, données personnelles d’autrui) ;',
        ],
        [
          'les annonces trompeuses, en double, sans bien réel, les offres de services, d’emploi ou de rencontre, et la publicité pour un autre site ;',
        ],
        [
          'toute tentative d’escroquerie, notamment les demandes de paiement anticipé ou de coordonnées bancaires.',
        ],
        [
          'Liste complète des biens interdits : ',
          todo('liste validée des biens interdits'),
        ],
      ],
    },
    {
      heading: 'Durée et cycle de vie des annonces',
      paragraphs: [
        [
          'Une annonce est publiée immédiatement après validation des champs et des photos. Elle expire automatiquement 60 jours après sa publication et disparaît alors des résultats. Elle reste visible dans votre espace, d’où vous pouvez la renouveler après avoir confirmé que le bien est toujours disponible. Vous pouvez à tout moment la modifier, la retirer ou la déclarer vendue ; une annonce vendue n’apparaît plus dans les résultats.',
        ],
      ],
    },
    {
      heading: 'Modération et signalement',
      paragraphs: [
        [
          'Les annonces ne sont pas relues avant publication. Tout membre peut signaler une annonce en indiquant un motif. La modération examine les signalements et peut retirer une annonce contraire aux présentes conditions ou à la loi. Chaque décision est enregistrée avec son motif, sa date et son auteur.',
        ],
      ],
    },
    {
      heading: 'Suspension du compte',
      paragraphs: [
        [
          'En cas de manquement grave ou répété (annonce interdite, fraude, signalements fondés), Smodeal peut suspendre le compte du membre. La suspension bloque l’accès au compte et retire ses annonces publiées. Le membre peut contester la décision en écrivant à ',
          contactEmail,
          '.',
        ],
      ],
    },
    {
      heading: 'Responsabilité',
      paragraphs: [
        [
          'Smodeal agit en qualité d’hébergeur des annonces publiées par ses membres. Chaque membre reste seul responsable du contenu de ses annonces et des transactions qu’il conclut.',
        ],
        [
          'Droit applicable et médiation : ',
          todo('droit applicable, juridiction et médiateur'),
        ],
      ],
    },
  ],
}

export const privacyPolicy: LegalDocument = {
  path: '/confidentialite',
  title: 'Politique de confidentialité',
  description:
    'Données personnelles collectées par Smodeal, finalités, durées de conservation et droits RGPD.',
  updatedAt: [lastReview],
  sections: [
    {
      heading: 'Responsable du traitement',
      paragraphs: [
        [
          'Le responsable du traitement est ',
          publisherName,
          '. Contact pour toute question relative à vos données : ',
          contactEmail,
          '.',
        ],
      ],
    },
    {
      heading: 'Données collectées',
      paragraphs: [
        ['Smodeal collecte uniquement les données nécessaires au service :'],
      ],
      items: [
        [
          'adresse email et mot de passe (stocké sous forme chiffrée par l’hébergeur) ;',
        ],
        ['pseudonyme, affiché publiquement avec vos annonces ;'],
        [
          'numéro de téléphone, jamais affiché publiquement : il n’est révélé qu’aux membres connectés qui le demandent, selon votre accord ;',
        ],
        [
          'contenu de vos annonces (texte, prix, localisation) et leurs photos ;',
        ],
        [
          'journaux techniques et de sécurité : connexions, demandes d’affichage de contact, signalements et actions de modération.',
        ],
      ],
    },
    {
      heading: 'Finalités et bases légales',
      paragraphs: [],
      items: [
        [
          'Gérer votre compte et publier vos annonces : exécution des conditions d’utilisation.',
        ],
        [
          'Mettre en relation acheteurs et vendeurs : exécution des conditions d’utilisation.',
        ],
        [
          'Prévenir les abus, la fraude et traiter les signalements : intérêt légitime et obligations légales de l’hébergeur.',
        ],
        [
          'Assurer la sécurité du service (limitation des tentatives) : intérêt légitime.',
        ],
      ],
    },
    {
      heading: 'Destinataires et hébergement',
      paragraphs: [
        [
          'Les données sont hébergées sur Appwrite Cloud, région de Francfort (Allemagne), et ne sont ni vendues ni utilisées à des fins publicitaires. Seuls l’équipe Smodeal habilitée et l’hébergeur, en qualité de sous-traitant, y ont accès.',
        ],
        [
          'Autres sous-traitants (envoi d’emails…) : ',
          todo('liste des sous-traitants'),
        ],
      ],
    },
    {
      heading: 'Durées de conservation',
      paragraphs: [],
      items: [
        [
          'Compte et profil : ',
          todo('durée de conservation après fermeture ou inactivité du compte'),
        ],
        [
          'Annonces et photos : ',
          todo('durée de conservation après retrait, vente ou expiration'),
        ],
        ['Numéro de téléphone : ', todo('durée de conservation du numéro')],
        [
          'Journaux de sécurité et de modération : ',
          todo('durée de conservation des journaux'),
        ],
      ],
    },
    {
      heading: 'Vos droits',
      paragraphs: [
        [
          'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données, ainsi que du droit de définir des directives sur leur sort après votre décès. Écrivez à ',
          contactEmail,
          ' ; une réponse vous sera apportée dans un délai d’un mois.',
        ],
        [
          'Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).',
        ],
      ],
    },
  ],
}

export const cookiePolicy: LegalDocument = {
  path: '/cookies',
  title: 'Cookies',
  description:
    'Smodeal n’utilise qu’un cookie strictement nécessaire à la connexion, sans mesure d’audience ni publicité.',
  updatedAt: [lastReview],
  sections: [
    {
      heading: 'Cookie utilisé',
      paragraphs: [
        [
          'Smodeal dépose un seul cookie, uniquement lorsque vous vous connectez : a_session_<identifiant du projet>. Il maintient votre session de membre. Il n’est pas lisible par les scripts de la page (httpOnly), n’est envoyé qu’à Smodeal et est supprimé à la déconnexion ou à l’expiration de la session.',
        ],
      ],
    },
    {
      heading: 'Pas de bandeau de consentement',
      paragraphs: [
        [
          'Ce cookie est strictement nécessaire au service que vous demandez (rester connecté). Conformément aux recommandations de la CNIL, il est exempté de consentement : aucun bandeau n’est donc affiché. Smodeal n’utilise ni cookie de mesure d’audience, ni cookie publicitaire, ni traceur tiers.',
        ],
        [
          'Si un outil de mesure d’audience ou un service tiers était ajouté, cette page serait mise à jour et votre consentement serait demandé lorsque la loi l’exige.',
        ],
      ],
    },
  ],
}

export const legalDocuments: LegalDocument[] = [
  legalNotice,
  termsOfUse,
  privacyPolicy,
  cookiePolicy,
]
