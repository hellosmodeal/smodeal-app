# Production et recette

État vérifié le 29 septembre 2026. Les données de production et de recette disposent maintenant de projets Appwrite Cloud distincts, tous deux à Francfort.

| Rôle | Projet | Identifiant | Site |
| --- | --- | --- | --- |
| Public / production actuelle | Smodeal dev | `6ab8046300165a85123a` | `smodeal-web`, branche `main`, `https://smodeal.com` |
| Recette Cloud | Smodeal recette | `6abb81ad00044a75f694` | `Smodeal recette`, branche `codex/v1-real-listings`, `https://smodeal-recette.appwrite.network` |
| Recette locale automatisée | smodeal-qa | `smodeal-qa` | Appwrite/Mailpit Docker, application sur localhost:18671 |

Le nom « Smodeal dev » du premier projet reste historique : il sert le site public. Le fichier racine `appwrite.config.json` continue de désigner ce projet. Ne pas y changer simplement l’identifiant pour lancer une recette.

## Projet Cloud de recette préparé

- Organisation existante « Personal Projects », plan affiché Free, région Francfort.
- Base `smodeal`, huit tables créées à partir du schéma du dépôt : `profiles`, `contacts`, `categories`, `listings`, `reports`, `moderation_logs`, `usage_events`, `rate_limits`.
- Aucune permission client accordée aux tables. La lecture anonyme des lignes des huit tables répond 401.
- La clé du projet public est refusée par le projet de recette : les clés ne sont pas partagées entre projets.
- Bucket `listing-photos`, JPG/JPEG/PNG/WebP, 5 Mo, lecture publique des photos, antivirus actif. Les contacts restent dans une table privée.
- Aucun utilisateur ni annonce de recette créé. Une clé serveur propre à ce projet, approuvée par l’utilisateur, expire après un mois (fin octobre 2026). Ses droits sont `users.read`, `users.write`, `sessions.write`, `rows.read`, `rows.write`, `files.read`, `files.write`. Elle est enregistrée comme variable secrète `APPWRITE_API_KEY` du seul site de recette ; aucune copie locale ni dans Git.

Les commandes de création ont été exécutées dans le terminal Appwrite de la console, déjà authentifié et limité au projet « Smodeal recette ». Aucun secret de la session n’a été copié dans le dépôt ou le poste.

## Site Cloud de recette

La vérification GitHub a été terminée et le dépôt raccordé. Site `6abbbc84000505ec42b3`, TanStack Start avec rendu serveur, Node 24, installation `corepack enable && pnpm install --frozen-lockfile`, build `pnpm build`, sortie `./.output`. La première compilation utilisait les valeurs par défaut Node 22/statique ; un redéploiement a appliqué la configuration corrigée.

Le site utilise le projet de recette, la base `smodeal` et `PUBLIC_SITE_URL=https://smodeal-recette.appwrite.network`. Ce hostname exact est enregistré comme plateforme Web pour les callbacks. `PUBLIC_SITE_INDEXABLE=false` dissocie les retours email de l’indexation : pages en `noindex, nofollow`, sans canonique. La production conserve son comportement par défaut. Ne jamais copier la clé du projet public. Empêcher les emails de recette vers des personnes réelles.

Les tests automatisés sous `infra/qa` restent strictement locaux : leurs gardes ne sont pas supprimées pour tester Cloud. La recette distante doit être préparée séparément, avec données fictives et nettoyage limité à ce projet. Les quotas et la disponibilité affichés lors de la création ne garantissent pas la capacité future du plan gratuit.

## Déploiement public

La V1 reste dans la [PR #6](https://github.com/hellosmodeal/smodeal-app/pull/6), avant fusion et activation. Suivre [la mise en production](mise-en-production.md) après raccordement et recette du site isolé. Le domaine canonique du site public reste `.com` jusqu’à la migration `.fr`.

### Réception et limites

La page d’accueil interroge les données isolées et affiche zéro annonce ; un essai de connexion avec un compte fictif inexistant retourne « Identifiants invalides. », et non une panne du limiteur. Les contrôles des parcours avec comptes réels de recette, des emails, des photos et de la modération restent à réceptionner. La clé devra être renouvelée ou révoquée à son échéance ; sa rotation remet les compteurs HMAC dans une nouvelle identité.

### Parcours Cloud à réceptionner

Utiliser deux membres fictifs et une boîte email dédiée autorisée par son propriétaire. La création et la récupération du mot de passe sont effectuées par la personne qui garde les identifiants. Aucune clé ni session Cloud n’est copiée vers les scripts locaux.

1. Recevoir la vérification email, revenir sur le domaine de recette et pouvoir publier après vérification. Recevoir ensuite la récupération du mot de passe et vérifier la nouvelle connexion.
2. Publier une annonce fictive avec une photo PNG/JPEG/WebP ; constater la photo dans le navigateur et l’absence du téléphone dans la réponse publique.
3. Tester le contact avec le second membre : autorisé avec accord, refusé sans accord, réponse privée non mise en cache. Une annonce vendue ou retirée doit répondre 404.
4. Après attribution explicitement approuvée du rôle admin au compte de recette, retirer une annonce signalée : statut `removed_by_moderation`, signalement `resolved`, une entrée `remove_listing`, fiche en 404.
5. Classer un autre signalement sans retrait : annonce active et fiche en 200, signalement `dismissed`, une entrée `dismiss_report`. Un second traitement doit être refusé sans nouvelle entrée.

Le dernier scénario et le retrait sont vérifiés par la recette locale automatisée du 29 septembre 2026 (cinq tests externes réussis). Ce résultat ne vaut pas réception des emails ni des parcours dans Cloud.
