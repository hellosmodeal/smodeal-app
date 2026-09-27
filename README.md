# Smodeal

Plateforme française de petites annonces entre particuliers : **publier un bien, le rechercher et contacter son vendeur**.

> État du projet : socle technique initialisé (TanStack Start, Appwrite, authentification). Les parcours métier restent à construire.

## Première version

- Comptes et profils vendeurs simples.
- Annonces avec jusqu'à 5 photos, recherche et filtres.
- Contact téléphonique réservé aux membres connectés.
- Partage, statut vendu, expiration et renouvellement.
- Administration, signalements et indicateurs d'usage.

Les enchères sont abandonnées. Paiement, commissions, avis, badges et mise en avant payante sont hors V1.

## Stack retenue

TanStack Start · React · TypeScript · Tailwind CSS · shadcn/ui · Appwrite Cloud (Auth, TablesDB, Storage).

Le plan Appwrite reste à définir ; l'hébergement proposé pour le serveur web est Appwrite Sites. Aucun backend Python séparé ni Better Auth n'est prévu pour ce lot.

## Documentation

| Document | Contenu |
| --- | --- |
| [Périmètre V1](docs/perimetre-v1.md) | Fonctionnalités, exclusions et critères de réception |
| [Architecture](docs/architecture.md) | Composants, données et règles d'accès proposées |
| [Feuille de route](docs/feuille-de-route.md) | Ordre de réalisation et décisions ouvertes |
| [Identité visuelle](docs/identite-visuelle.md) | Nom et direction du logo validés |
| [Design](DESIGN.md) | Direction visuelle validée pour la V1, écrans à construire et livrables de marque |

## Développement

Prérequis : Node 24 et pnpm 11 (`corepack enable`), un projet Appwrite Cloud.

```bash
pnpm install
cp .env.example .env   # renseigner endpoint, identifiant de projet et clé API serveur
pnpm dev               # http://localhost:8670
```

Le schéma Appwrite est déclaré dans `appwrite.config.json` et se pousse avec la CLI Appwrite :
`appwrite push tables` puis `appwrite push buckets`.

Le domaine officiel est `https://smodeal.com` (`www.smodeal.com` redirige vers lui). En production, `PUBLIC_SITE_URL=https://smodeal.com` est une variable du site Appwrite `smodeal-web`, pas une valeur versionnée ; en local, la laisser vide. L'indexation et les liens canoniques ne s'activent que si la variable est renseignée **et** que la requête vise exactement cet hôte : les domaines de prévisualisation Appwrite, `www` et le poste local restent en `noindex`, avec une image Open Graph servie depuis l'origine de la requête. Les pages de connexion, d'inscription et de compte restent hors indexation.

| Commande | Rôle |
| --- | --- |
| `pnpm test` | Tests des règles métier (Vitest) |
| `pnpm typecheck` | Vérification des types |
| `pnpm lint` / `pnpm format` | Biome : contrôle / correction |
| `pnpm lint:tailwind` | Classes Tailwind canoniques |
| `pnpm knip` | Code et dépendances inutilisés |
| `pnpm build` | Build de production |

Lefthook installe les hooks Git à l'installation ; la CI GitHub rejoue l'ensemble. Conventions pour agents et contributeurs : [AGENTS.md](AGENTS.md).

Les données de test doivent être fictives. Ne jamais versionner de secrets, de coordonnées personnelles ou de données de production.

## Référence

Documentation initialisée le 26 septembre 2026 à partir du cadrage du premier lot et des décisions ultérieures. Le nom de marque retenu est **Smodeal**.
