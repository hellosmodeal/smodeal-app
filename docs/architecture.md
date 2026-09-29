# Architecture

## Choix validés

| Composant | Choix |
| --- | --- |
| Application web et serveur | TanStack Start, React, TypeScript |
| Interface | Tailwind CSS et shadcn/ui |
| Identité | Appwrite Auth |
| Données | Appwrite TablesDB |
| Photos | Appwrite Storage |
| Infrastructure de services | Appwrite Cloud |
| Hébergement SSR | Appwrite Sites, TanStack Start, Node 24 |

Annonces publiques rendues côté serveur ; filtres dans l'URL. Administration métier dans l'application. Better Auth et backend Python séparé hors V1.

Le socle et les premières tranches sont implémentés ; les limites de réception figurent dans [l’état V1](etat-v1.md). Les éléments d’exploitation non réalisés restent proposés.

## Répartition des responsabilités

- Navigateur : formulaires, consultation, navigation et interactions.
- Serveur TanStack Start : sessions, validation des entrées, autorisation des opérations métier et accès privilégiés.
- Appwrite : identité, persistance et stockage avec permissions par ressource.
- Traitement planifié : expiration des annonces ; mécanisme d'exécution à choisir.

Les requêtes publiques doivent exclure immédiatement les annonces dont la date d'expiration est dépassée, même si le traitement planifié prend du retard.

## Modèle de données proposé

| Ensemble | Données principales |
| --- | --- |
| Identités Auth | Compte, email vérifié, sessions |
| Profils publics | Identifiant utilisateur et pseudonyme |
| Contacts privés | Identifiant utilisateur, téléphone et accord d'affichage |
| Catégories | Libellé, identifiant stable, état actif |
| Annonces | Propriétaire, champs métier, prix en centimes, statut, photos, dates de publication et expiration |
| Signalements | Annonce, auteur, motif, état et dates |
| Journal de modération | Administrateur, cible, action, motif et date |
| Événements d'usage | Type d'événement, annonce et date ; données minimales à définir |
| Compteurs anti-abus privés | Action, sujet HMAC, fenêtre et nombre de demandes ; aucune permission client |

États proposés : active, vendue, expirée, retirée par le vendeur, retirée par modération. Les transitions autorisées et la conservation des fiches non actives seront précisées avant implémentation.

## Accès et confidentialité

- Visiteur : annonces actives et profils publics ; aucune coordonnée privée.
- Membre : accès au contact selon la règle validée et gestion de ses seules annonces.
- Administrateur : modération après contrôle explicite du rôle côté serveur.
- Clés privilégiées : exclusivement côté serveur, jamais dans le bundle client ni dans Git.
- Les coordonnées privées doivent être séparées des ressources lisibles publiquement.
- Un identifiant de vendeur fourni par le navigateur ne prouve pas la propriété : utiliser l'identité de session.
- Les appels privilégiés doivent appliquer les règles métier, même s'ils contournent les permissions ordinaires du service.
- Ne pas mettre en cache publiquement les réponses contenant des coordonnées ou une session.
- La suspension doit bloquer les opérations du compte et masquer ses annonces actives ; vérifier le comportement des sessions existantes.
- Une annonce retirée par modération ne peut pas être réactivée par un simple renouvellement.

## Recherche et médias

Prévoir des index adaptés aux filtres, au tri et à la recherche textuelle. Valider la pertinence sur un jeu fictif d'annonces françaises, notamment accents et termes courts. Les capacités exactes seront vérifiées avant de promettre une recherche avancée.

Limiter les photos à cinq ; formats, poids et dimensions à fixer. Vérifier le contenu réel des fichiers et les droits de suppression. Définir le nettoyage des médias orphelins.

## Exploitation et validation

Appwrite Sites héberge le site public : framework TanStack Start, runtime Node 24, installation `corepack enable && pnpm install --frozen-lockfile`, build `pnpm build`, sortie `./.output`, déploiement depuis la branche `main` du dépôt GitHub. La configuration Cloud a été vérifiée le 29 septembre 2026. Plan, séparation des environnements, service d’email, mécanisme planifié et sauvegardes restent à préciser. Voir [la mise en production](mise-en-production.md).

La CI GitHub vérifie lint, classes Tailwind, types, tests métier, exports inutilisés et build. Une première recette Auth/TablesDB/Storage et emails a réussi sur Appwrite/Mailpit locaux ; la recette complète et la restauration restent à effectuer. Voir `infra/qa/README.md`.

## Références officielles à consulter à l'initialisation

- [TanStack Start](https://tanstack.com/start/latest)
- [Appwrite](https://appwrite.io/docs)

Aucun numéro de version ni coût d'exploitation n'est figé par cette documentation.
