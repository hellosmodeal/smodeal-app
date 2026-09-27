# Feuille de route

Aucune durée n'est engagée à ce stade. Chaque étape doit rester démontrable et recettable avant de passer à la suivante.

## Décisions avant développement

- [ ] Confirmer catégories et formulaire commun.
- [ ] Confirmer le contact téléphonique réservé aux membres connectés.
- [ ] Valider l'expiration proposée à 60 jours.
- [ ] Valider la publication immédiate et la modération a posteriori.
- [ ] Fixer date cible, interlocuteur de validation et responsable de modération.
- [ ] Arrêter les conditions commerciales et frais récurrents hors de ce dépôt.
- [ ] Choisir hébergement SSR, plan et région Appwrite, email et sauvegardes. Proposé : Appwrite Sites (SSR, même
  projet Appwrite, région Francfort).
- [x] Confirmer le domaine officiel : `https://smodeal.com` (`www` redirige), déjà servi par le site Appwrite
  `smodeal-web` (branche `main`). Indexation active seulement avec `PUBLIC_SITE_URL` sur ce site.
- [ ] Valider les écrans principaux et préparer les fichiers de marque définitifs.
- [x] Valider la palette et la typographie utilisées sur la page d'accueil.
- [ ] Remplacer le logo raster intégré par les fichiers vectoriels définitifs.

## Étapes de réalisation

| Étape | Contenu | Sortie attendue |
| --- | --- | --- |
| 1. Socle | Initialisation application, environnements, CI, modèle et permissions, authentification | Connexion et contrôles de droits vérifiés |
| 2. Annonces | Profil simple, formulaire, photos, gestion vendeur, statut vendu | Publication et gestion de ses propres annonces |
| 3. Découverte | Recherche, filtres, pagination, fiches SSR, partage et contact protégé | Parcours trouver un bien puis contacter son vendeur |
| 4. Exploitation | Expiration, renouvellement, signalements, administration, indicateurs | Modération et cycle de vie vérifiés |
| 5. Livraison | Recette, corrections, restauration testée, documentation de déploiement et gestion | Mise en ligne sur l'infrastructure convenue |

## Évolutions à chiffrer séparément

1. **Mise en avant payante** : prochaine source de revenus proposée ; durée, emplacement, prix, règles de classement et paiement du service à définir.
2. **Avis simples** : invitation à usage unique, acheteur connecté distinct du vendeur, une note de 1 à 5, moyenne et nombre d'avis ; sans commentaires au départ. Prévoir expiration, anti-doublon, contestation et conservation après retrait d'annonce.
3. **Badge fiable** : préciser les critères envisagés (contact, « deposit », dix ventes et note supérieure à 4/5), leur caractère cumulatif et les contrôles. Aucun badge automatique avant définition de ces règles.
4. **Commissions et publicité** : cadrage distinct du paiement, des reversements, incidents et règles d'affichage.

Une confirmation déclarative ne prouve pas le paiement. L'absence de paiement intégré dans la V1 ne permet pas de prélever automatiquement une commission.

## État de la page d'accueil

Une première version responsive de la direction artistique et de la page d'accueil est intégrée. Elle montre la structure d'un accueil de petites annonces : recherche, catégories, cartes d'annonces et accès à l'inscription. Les cartes, prix et lieux sont des exemples fictifs explicitement signalés dans l'interface ; la recherche filtre ces exemples pour permettre de tester la maquette. Les annonces réelles, catégories validées et filtres complets seront raccordés à l'étape « Découverte », une fois les données et les routes de consultation disponibles.

## Tenue de la documentation

Mettre à jour le périmètre et les critères de réception lorsqu'une décision change. Distinguer explicitement ce qui est proposé, accepté et implémenté. Ajouter les commandes de démarrage et de déploiement uniquement après les avoir vérifiées dans le projet.
