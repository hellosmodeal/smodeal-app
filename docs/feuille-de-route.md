# Feuille de route

Aucune durée n'est engagée à ce stade. Chaque étape doit rester démontrable et recettable avant de passer à la suivante.

## Décisions avant développement

- [x] Retenir les six catégories existantes et le formulaire commun (décision du 28 septembre 2026).
- [x] Retenir le contact téléphonique réservé aux membres connectés avec accord du vendeur.
- [x] Retenir une expiration à 60 jours et le renouvellement par le propriétaire.
- [x] Retenir la publication immédiate après validation, avec signalement et modération dès l'ouverture réelle.
- [ ] Fixer date cible, interlocuteur de validation et responsable de modération.
- [ ] Arrêter les conditions commerciales et frais récurrents hors de ce dépôt.
- [ ] Choisir hébergement SSR, plan et région Appwrite, email et sauvegardes. Proposé : Appwrite Sites (SSR, même
  projet Appwrite, région Francfort).
- [x] Retenir `https://smodeal.fr` comme domaine principal cible, avec `.com` conservé pour redirection.
- [ ] Migrer DNS, HTTPS, canonique et redirections : le `.fr` redirige encore vers le `.com` actif. Voir [la migration](migration-domaine-fr.md).
- [ ] Valider les écrans principaux et préparer les fichiers de marque définitifs.
- [x] Valider la palette et la typographie utilisées sur la page d'accueil.
- [x] Appliquer le retour bleu et le mot-symbole Smodeal.fr avec une déclinaison vectorielle.

Les choix fonctionnels ci-dessus guident la V1. Les premières tranches sont implémentées dans le code ; leur recette complète reste ouverte, voir [l’état V1](etat-v1.md). Voir [les décisions de lancement](decisions-lancement.md) pour l'ordre des lots et les critères de viabilité.

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

## État du code de la V1

Accueil et recherche utilisent désormais Appwrite ; les données fictives sont réservées aux fixtures de tests. Les fiches publiques appliquent le statut actif et l’expiration. Les comptes disposent de parcours de vérification email et de récupération du mot de passe. Publication, vente, retrait, renouvellement et gestion paginée sont implémentés, ainsi que signalement et traitement administratif avec journal.

Cette étape ne signifie pas ouverture aux vrais vendeurs : édition, instrumentation d’usage, contrôles anti-abus, recette des emails et mutations réelles, sauvegardes et validation légale restent à effectuer. Le domaine public conserve sa configuration précédente tant que la migration DNS est en attente. Voir [l’état V1](etat-v1.md).

## Tenue de la documentation

Mettre à jour le périmètre et les critères de réception lorsqu'une décision change. Distinguer explicitement ce qui est proposé, accepté et implémenté. Ajouter les commandes de démarrage et de déploiement uniquement après les avoir vérifiées dans le projet.
