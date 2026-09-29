# Mise en production de la V1

État vérifié le 29 septembre 2026. La [PR #6](https://github.com/hellosmodeal/smodeal-app/pull/6) contient la V1 ; elle n’est pas encore fusionnée. Le site public sert le commit `55b9e69` de `main`.

## Infrastructure vérifiée

| Élément | Configuration observée |
| --- | --- |
| Appwrite Cloud | Projet configuré dans `appwrite.config.json`, nommé « Smodeal dev », région Francfort |
| Site | `smodeal-web`, TanStack Start, Node 24, branche `main` |
| Installation | `corepack enable && pnpm install --frozen-lockfile` |
| Construction | `pnpm build`, sortie `./.output` |
| Variables | Endpoint, projet et base correspondent à la configuration du dépôt ; clé API déclarée secrète |
| Origine | `PUBLIC_SITE_URL=https://smodeal.com` |
| Domaine public | `.com` répond 200 avec son canonique ; `.fr` redirige encore vers `.com` |

La valeur de la clé secrète du site n’est pas exposée par l’API Appwrite. Sa présence déclarée ne prouve pas ses permissions à l’exécution ; celles-ci restent à vérifier lors de la recette du déploiement.

## Schéma anti-abus installé

La table `rate_limits` a été créée dans le projet Cloud configuré : cinq colonnes disponibles, index `window_end` disponible, aucune permission client, `rowSecurity=false`. Une lecture sans clé ni session est refusée en 401.

Un compteur temporaire isolé a vérifié une transaction avec TTL 60 secondes, un incrément atomique et le refus de dépasser le maximum. Le compteur a été supprimé après l’essai. Aucun compte, annonce ni email de recette n’a été créé dans Cloud. Les autres tables et le bucket n’ont pas été modifiés.

Les règles et coûts du limiteur figurent dans [anti-abus.md](anti-abus.md). Une rotation de la clé utilisée comme secret HMAC change l’identité des compteurs ; elle doit être coordonnée avec les déploiements.

## Passage du code en ligne

1. Vérifier que la tête de la PR a passé la CI et le build Appwrite. Le commit `9dd6c74` a passé les deux.
2. Fusionner la version validée dans `main` pour déclencher le site configuré. Aucune fusion n’a été effectuée pendant la préparation du schéma.
3. Vérifier le nouveau commit actif, les pages publiques, l’accès anonyme refusé aux parcours privés et l’absence de coordonnées dans les pages publiques.
4. Recetter les emails et les mutations sur un environnement distant dédié avec comptes fictifs, puis vérifier les secrets, permissions et origines du site de production. Les tests automatisés du dépôt refusent volontairement les cibles Cloud ; ne pas retirer leurs gardes pour effectuer cette recette.

## Avant ouverture aux vrais vendeurs

Le projet nommé « Smodeal dev » alimente aujourd’hui le site public. Un projet distinct « Smodeal recette » a été créé avec son schéma et son stockage ; son site est raccordé au dépôt, en rendu serveur Node 24, avec un accès serveur isolé et l’indexation désactivée. Voir [les environnements](environnements.md). Terminer la recette des parcours utilisateurs isolés avant ouverture aux vendeurs.

Restent également à réceptionner : restauration des données et photos, conservation/nettoyage des médias, cas réseau et liens expirés, coût sous charge, instrumentation d’usage, responsable de modération et textes légaux. Voir [l’état V1](etat-v1.md) et [les décisions de lancement](decisions-lancement.md). Ces éléments distinguent la mise en ligne technique de l’ouverture aux vendeurs.

La migration vers `.fr` suit son [plan dédié](migration-domaine-fr.md) ; le canonique reste `.com` tant que DNS, HTTPS et redirections ne sont pas migrés.
