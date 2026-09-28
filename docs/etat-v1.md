# État de la V1

État du code au 28 septembre 2026. Implémenté signifie présent et testé dans le dépôt ; cela ne prouve ni un déploiement ni une recette avec les services externes.

## Parcours implémentés

| Parcours | Réception dans le code |
| --- | --- |
| Compte | Connexion, inscription, demande de vérification, confirmation explicite du lien email, récupération générique et nouveau mot de passe ; session suspendue refusée |
| Publication | Email vérifié, six catégories, champs validés, téléphone privé obligatoire, accord d’affichage facultatif et non présélectionné, jusqu’à cinq photos JPG/PNG/WebP de 5 Mo maximum avec signature vérifiée |
| Vendeur | Liste paginée, vendu, retrait, renouvellement après expiration ; propriété contrôlée côté serveur et annonce retirée par modération non réactivable |
| Découverte | Accueil, filtres, pagination et fiche SSR sur Appwrite ; aucune annonce fictive dans les résultats ; filtre actif et non expiré à chaque lecture publique |
| Contact | Demande POST d’un membre actif, accord du vendeur ou propre numéro du propriétaire ; réponse privée sans cache ; aucune coordonnée dans les données publiques |
| Modération | Signalement d’une annonce disponible par un membre distinct du vendeur ; liste paginée réservée au rôle Appwrite `admin` ; retrait ou classement avec journal transactionnel |

Routes : `/compte`, `/deposer`, `/mes-annonces`, `/recherche`, `/annonces/$listingId`, `/moderation`, `/mot-de-passe-oublie`, `/verification-email`, `/reinitialiser-mot-de-passe`.

## Choix et limites

- Recherche textuelle : plein texte Appwrite sur le titre, au moins trois caractères. Les demandes trop courtes affichent une explication sans résultats trompeurs. La ville utilise une correspondance exacte ; il n’y a pas de géolocalisation ni de recherche par rayon.
- Le consentement téléphonique est lié au vendeur : la valeur saisie lors d’un dépôt s’applique à ses annonces. Sans accord, les autres membres ne peuvent pas obtenir son numéro. Aucune messagerie intégrée.
- Expiration : exclusion immédiate des résultats après 60 jours, même si le statut stocké est encore actif. Le renouvellement est possible ; aucun traitement différé n’a été installé.
- Photos : le bucket configuré permet une lecture publique des fichiers. Un retrait masque la fiche, sans retirer automatiquement les fichiers du stockage ; conservation et nettoyage sont encore à définir. Après un résultat de commit incertain, conserver les photos évite de casser une annonce qui aurait réellement été publiée : réconciliation opérationnelle encore nécessaire.
- Édition d’une annonce, profil public vendeur, suspension administrative avec retrait de ses annonces et instrumentation des événements d’usage restent à construire.

## Avant ouverture aux vrais vendeurs

1. Recetter sur un environnement isolé : inscription, emails, expiration/invalidation de liens, publication avec photos, erreurs réseau, contact, statuts et modération. Vérifier les scopes API nécessaires aux lignes, au stockage et aux transactions. Utiliser une origine HTTPS approuvée pour les callbacks email.
2. Ajouter les limites anti-abus adaptées aux endpoints privilégiés, définir le responsable de modération et fournir les textes légaux validés par le responsable du projet.
3. Tester sauvegarde et restauration des données et photos ; définir réconciliation des commits incertains et purge des médias orphelins.
4. Recetter mobile et ordinateur avec de vraies annonces de test dans cet environnement, puis déployer la version validée.

Le schéma distant a été vérifié en lecture seule : les tables, colonnes et index déclarés sont disponibles, les tables n’accordent pas de permissions client et le bucket correspond aux limites prévues. Cette vérification ne remplace pas la recette des mutations et des emails.
