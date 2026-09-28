# AGENTS.md — Smodeal

Plateforme française de petites annonces entre particuliers : publier un bien, le rechercher, contacter son vendeur.
Le cadrage fait foi : [README](README.md), [périmètre V1](docs/perimetre-v1.md), [architecture](docs/architecture.md),
[feuille de route](docs/feuille-de-route.md), [identité visuelle](docs/identite-visuelle.md).

## Stack

- TanStack Start (React 19, SSR, server functions) · Vite 8 · Nitro (adaptateur Node, hébergement proposé : Appwrite Sites).
- TypeScript 7 (compilateur natif) · Zod 4 · Vitest 5.
- Biome (format + lint + imports) : pas d'ESLint ni de Prettier.
- Tailwind CSS 4 · shadcn/ui (style `base-nova`, Base UI) · icônes Lucide.
- Appwrite Cloud via `node-appwrite` côté serveur uniquement : Auth, TablesDB, Storage.
- pnpm 11, Node 24. Pas de Bun, pas de Better Auth, pas de backend séparé.

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Serveur de dev sur le port 8670 |
| `pnpm test` | Vitest (règles métier) |
| `pnpm typecheck` | Génère l'arbre des routes puis `tsc --noEmit` |
| `pnpm lint` · `pnpm format` | Biome en lecture seule · Biome avec corrections |
| `pnpm lint:tailwind` | Classes Tailwind canoniques (`tailwind-canonical`) |
| `pnpm knip` | Fichiers, exports et dépendances inutilisés |
| `pnpm build` | Build SSR dans `.output/` |

Lefthook : pre-commit (Biome, tailwind-canonical sur les fichiers indexés), pre-push (typecheck, test, knip).
La CI GitHub (`.github/workflows/ci.yml`) exécute `biome ci` puis l'ensemble. Ne jamais contourner les hooks.

## Règles par sujet

Lire la règle concernée avant de modifier les fichiers de son périmètre (`.agents/rules/`, lien `.claude/rules`) :

| Règle | À lire avant de toucher |
| --- | --- |
| [typescript](.agents/rules/typescript.md) | tout fichier `.ts` / `.tsx` |
| [zod](.agents/rules/zod.md) | entrées de server functions, variables d'environnement |
| [vitest](.agents/rules/vitest.md) | tests `*.test.ts`, `vitest.config.ts` |
| [biome](.agents/rules/biome.md) | `biome.json`, formatage, suppressions de lint |
| [tailwind-v4](.agents/rules/tailwind-v4.md) | classes Tailwind, `src/styles.css` |
| [shadcn-ui](.agents/rules/shadcn-ui.md) | composants UI, `components.json` |

Générées depuis les modèles `peaklab.sync-ai-docs` (`languages/typescript`, `validation-auth/zod`, `testing/vitest`,
`patterns/biome`, `frontend/tailwind-v4`, `frontend/shadcn-ui`) puis adaptées au projet : les adaptations font foi.

## Architecture : vertical slices

```
src/
  features/<domaine>/     une tranche par fonctionnalité
    rules.ts              règles métier pures, sans I/O, testées
    rules.test.ts
    functions.ts          server functions (createServerFn) appelables depuis l'UI
    *.server.ts           accès Appwrite, cookies, secrets — jamais importé côté client
    components/           UI propre à la tranche
  server/                 socle serveur partagé : env.server.ts, appwrite.server.ts
  routes/                 routes fichiers minces : chargement, garde, composition
  components/ui/          composants shadcn (générés, ne pas réécrire à la main)
```

- Une route ne contient pas de logique métier : elle appelle une server function de sa tranche.
- Une règle métier (statut, expiration, propriété, accès contact, rôle) vit dans `rules.ts` et se teste sans Appwrite.
- Pas de couche use-case/repository générique tant qu'une seconde infrastructure n'existe pas.
- Alias d'import : `@/*` → `src/*`.

## TDD

Développement piloté par les tests pour tout comportement : test rouge sur une interface publique, code minimal,
vert, refactor. Tester les règles pures et les server functions à leur frontière ; ne mocker que les frontières
externes (Appwrite, horloge). Les noms de tests décrivent le comportement en français.

## Sécurité et accès

- Clé API Appwrite, cookies de session et `node-appwrite` : fichiers `*.server.ts` uniquement. La protection d'import
  de TanStack Start fait échouer le build si un tel fichier atteint le client.
- Lire l'environnement par requête via `getServerEnv()`, jamais au niveau module.
- Session : cookie `a_session_<projectId>` httpOnly, `sameSite=lax`, `secure` en production.
- Les tables Appwrite n'accordent aucune permission client : toute lecture/écriture passe par le serveur, qui applique
  les règles métier (`rules.ts`). L'identité vient de la session, jamais d'un identifiant envoyé par le navigateur.
- Contrôle `beforeLoad` = confort de navigation ; l'autorisation réelle se fait dans chaque server function.
- Administrateur = libellé Appwrite `admin`, vérifié côté serveur.
- Coordonnées privées (table `contacts`) jamais présentes dans une réponse publique ni mise en cache publique.
- Requêtes publiques : filtrer `status = active` ET `expiresAt > maintenant`, même si l'expiration planifiée a du retard.

## Données Appwrite

Schéma déclaratif dans `appwrite.config.json` (base `smodeal`, tables, bucket `listing-photos`), poussé avec
`appwrite push tables` / `appwrite push buckets`. Prix en centimes. Statuts d'annonce :
`active`, `sold`, `expired`, `withdrawn`, `removed_by_moderation` (synchronisés avec `features/listings/rules.ts`).
Retirer une colonne du fichier peut la supprimer au push : relire le diff avant.

## Décisions encore ouvertes

Décisions V1 retenues le 28 septembre 2026 : France, six catégories existantes, formulaire commun, expiration
60 jours, contact réservé aux membres connectés avec accord du vendeur, email vérifié avant publication.
Ces parcours ne sont pas encore tous implémentés. Voir `docs/decisions-lancement.md`.

Appwrite Sites sert déjà la production. Restent à préciser : séparation des environnements, plan/région,
photos jpg/png/webp ≤ 5 Mo lisibles publiquement, email, sauvegardes et mécanisme planifié.
Le domaine principal cible est `smodeal.fr` ; il redirige encore vers le `.com` actif. Ne pas changer le
domaine canonique avant migration DNS/HTTPS. La marque utilise le mot-symbole Smodeal.fr bleu et gris.

## Conventions

- Interface et contenus en français ; nom de marque « Smodeal » (jamais « Smodial »).
- Données de test fictives. Aucun secret, coordonnée réelle ou donnée de production dans Git ; `.env` est ignoré,
  `.env.example` liste les variables sans valeur.
- Ajouter un composant shadcn : `pnpm dlx shadcn@latest add <composant>`.
- Biome ne formate pas le Markdown : conserver la mise en forme des documents.
- Mettre à jour `docs/` quand une décision change ; distinguer proposé, accepté et implémenté.
