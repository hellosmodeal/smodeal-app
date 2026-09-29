# Production et recette

État vérifié le 29 septembre 2026. Les données de production et de recette disposent maintenant de projets Appwrite Cloud distincts, tous deux à Francfort.

| Rôle | Projet | Identifiant | Site |
| --- | --- | --- | --- |
| Public / production actuelle | Smodeal dev | `6ab8046300165a85123a` | `smodeal-web`, branche `main`, `https://smodeal.com` |
| Recette Cloud | Smodeal recette | `6abb81ad00044a75f694` | Création et connexion GitHub en attente de vérification du compte `hellosmodeal` |
| Recette locale automatisée | smodeal-qa | `smodeal-qa` | Appwrite/Mailpit Docker, application sur localhost:18671 |

Le nom « Smodeal dev » du premier projet reste historique : il sert le site public. Le fichier racine `appwrite.config.json` continue de désigner ce projet. Ne pas y changer simplement l’identifiant pour lancer une recette.

## Projet Cloud de recette préparé

- Organisation existante « Personal Projects », plan affiché Free, région Francfort.
- Base `smodeal`, huit tables créées à partir du schéma du dépôt : `profiles`, `contacts`, `categories`, `listings`, `reports`, `moderation_logs`, `usage_events`, `rate_limits`.
- Aucune permission client accordée aux tables. La lecture anonyme des lignes des huit tables répond 401.
- La clé du projet public est refusée par le projet de recette : les clés ne sont pas partagées entre projets.
- Bucket `listing-photos`, JPG/JPEG/PNG/WebP, 5 Mo, lecture publique des photos, antivirus actif. Les contacts restent dans une table privée.
- Aucun utilisateur ni annonce de recette créé ; aucune nouvelle clé API permanente créée.

Les commandes de création ont été exécutées dans le terminal Appwrite de la console, déjà authentifié et limité au projet « Smodeal recette ». Aucun secret de la session n’a été copié dans le dépôt ou le poste.

## Raccordement du site restant

GitHub exige une vérification par email de `hellosmodeal` avant la connexion Appwrite au dépôt. Terminer cette vérification dans le navigateur, puis reprendre la création du site sur le projet de recette.

Le site de recette devra utiliser son propre identifiant de projet et ses propres accès serveur, la base `smodeal` et une origine HTTPS de recette explicitement approuvée pour les callbacks. Ne jamais y copier la clé du projet public. Garder les prévisualisations hors indexation et empêcher les emails de recette vers des personnes réelles.

Les tests automatisés sous `infra/qa` restent strictement locaux : leurs gardes ne sont pas supprimées pour tester Cloud. La recette distante doit être préparée séparément, avec données fictives et nettoyage limité à ce projet. Les quotas et la disponibilité affichés lors de la création ne garantissent pas la capacité future du plan gratuit.

## Déploiement public

La V1 reste dans la [PR #6](https://github.com/hellosmodeal/smodeal-app/pull/6), avant fusion et activation. Suivre [la mise en production](mise-en-production.md) après raccordement et recette du site isolé. Le domaine canonique du site public reste `.com` jusqu’à la migration `.fr`.
