# Smodeal

Plateforme française de petites annonces entre particuliers : **publier un bien, le rechercher et contacter son vendeur**.

> État du projet : comptes, publication, gestion vendeur, découverte et signalement implémentés dans le code. La recette complète avec emails et mutations Appwrite reste à réaliser avant ouverture aux vrais vendeurs. Voir [l’état de la V1](docs/etat-v1.md).

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
| [Décisions de lancement](docs/decisions-lancement.md) | V1 française, choix produit et mesure de viabilité |
| [État V1](docs/etat-v1.md) | Parcours implémentés, limites et recette restante |
| [Migration .fr](docs/migration-domaine-fr.md) | Domaine cible et séquence DNS/HTTPS/SEO |

## Développement

Prérequis : Node 24 et pnpm 11 (`corepack enable`), un projet Appwrite Cloud.

```bash
pnpm install
cp .env.example .env   # renseigner endpoint, identifiant de projet et clé API serveur
pnpm dev               # http://localhost:8670
```

Le schéma Appwrite est déclaré dans `appwrite.config.json` et se pousse avec la CLI Appwrite :
`appwrite push tables` puis `appwrite push buckets`.

Le domaine principal cible est `https://smodeal.fr`. Il redirige encore vers le domaine actif `https://smodeal.com` : suivre la [migration](docs/migration-domaine-fr.md) avant de changer la configuration. En production, `PUBLIC_SITE_URL` reste l'origine du domaine qui sert directement le site, dans Appwrite ; en local, la laisser vide pour le travail visuel. Pour recetter les emails, utiliser une prévisualisation HTTPS disposant de ces routes et configurer son origine approuvée dans `PUBLIC_SITE_URL`. L'indexation et les liens canoniques ne s'activent que si la variable est renseignée **et** que la requête vise exactement cet hôte : les domaines de prévisualisation et le poste local restent en `noindex`. Les pages de connexion, d'inscription, de compte et de résultats de recherche restent hors indexation.

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
