# Protections anti-abus

Les mutations Smodeal passent par le limiteur serveur Appwrite avant le service métier. La table privée `rate_limits` n’a aucune permission client. Ses clés sont des HMAC SHA-256 : ni adresse email ni jeton n’y sont stockés en clair.

## Politiques V1

| Action | Limite par sujet | Fenêtre |
| --- | ---: | --- |
| Connexion | 10 | 15 minutes |
| Inscription | 5 | 1 heure |
| Récupération de mot de passe | 3 | 15 minutes |
| Vérification de lien | 10 | 15 minutes |
| Renvoi de vérification | 3 | 15 minutes |
| Publication ou renouvellement | 10 | 1 heure |
| Édition ou changement de statut | 30 | 1 heure |
| Affichage d’un contact | 30 | 10 minutes |
| Signalement | 10 | 1 heure |
| Modification du compte | 20 | 1 heure |

Les membres sont identifiés par un HMAC de leur identifiant Appwrite stable et de l’action. Les entrées anonymes consomment d’abord un seau dérivé de l’adresse email normalisée ou du `userId` du jeton, puis un quota global par action. Le seau est réparti entre 4 096 clés HMAC : une collision partage donc conservativement un quota, sans créer une clé par valeur fournie par un attaquant. Le secret d’un jeton ne participe pas à la clé.

L’adresse IP n’est pas utilisée : aucun en-tête `X-Forwarded-For` arbitraire n’est digne de confiance sans une configuration de proxy explicitement validée.

## Réponse et disponibilité

Un dépassement répond `429`, `Retry-After`, `Cache-Control: no-store` et un message français. L’indisponibilité de la table, ou huit conflits de transaction successifs, répond `503` et bloque l’action. Les compteurs utilisent une fenêtre fixe ; l’horloge est injectée dans le cœur pour la recette.

Chaque demande anonyme engage deux transactions, seau puis globale. Un seau déjà à sa limite s’arrête avant de consommer le quota global. Chaque transaction incrémente atomiquement un compteur Appwrite avec un maximum, et effectue jusqu’à huit essais avec un délai aléatoire plafonné à 200 ms en cas de conflit. La ligne est stable entre les fenêtres et est remise à un à la fenêtre suivante : le stockage anonyme est donc borné à 4 096 lignes par action, plus la ligne globale. Ce coût Appwrite est volontairement assumé en V1 ; un quota d’edge ou de corps de requête pourra compléter ces protections sans remplacer ce contrôle serveur.

## Exploitation locale

Après une modification de `appwrite.config.json`, initialiser uniquement le schéma Appwrite local via le bootstrap de recette avant d’exécuter les tests opt-in (`SMODEAL_QA=1`). Le test de concurrence envoie 11 consommations simultanées pour un sujet et vérifie que le compteur ne dépasse pas la limite.
