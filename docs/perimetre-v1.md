# Périmètre V1

## Objectif

Tester en France l'usage d'un site de petites annonces entre particuliers. La réussite initiale se mesure par la publication d'annonces et les demandes de contact. Une demande de contact ne prouve pas une vente.

Ce périmètre sert de base au chiffrage et à la réalisation. Il ne constitue pas un engagement de prix ou de délai. Les conditions commerciales sont conservées hors de ce dépôt public.

## Fonctions incluses

| Domaine | Comportement attendu |
| --- | --- |
| Comptes | Inscription, vérification d'email, connexion, déconnexion, récupération du mot de passe, modification du profil |
| Profil public | Pseudonyme et annonces actives, sans note ni badge |
| Annonces | Création, modification, retrait et déclaration comme vendu par leur propriétaire |
| Champs | Titre, description, catégorie, état, prix en euros, commune, code postal, département ; jusqu'à 5 photos |
| Consultation | Accueil avec annonces récentes, liste paginée et fiche détaillée accessibles sans compte |
| Recherche | Mots-clés, catégorie, département, commune ou code postal, fourchette de prix ; tri par date ou prix |
| Contact | Téléphone requis pour publier, affiché sur demande aux membres connectés avec accord du vendeur |
| Partage | URL stable, copie du lien et métadonnées titre/photo pour les services compatibles |
| Cycle de vie | Vendu retiré des résultats actifs ; expiration et renouvellement depuis l'espace vendeur |
| Modération | Signalements, retrait d'annonce, suspension de compte ; motif, date et auteur des actions |
| Indicateurs | Annonces publiées, clics de contact et annonces déclarées vendues sur une période sélectionnée |

Interface française responsive. Un formulaire commun à toutes les catégories. Le paiement et la remise du bien sont organisés directement entre les parties.

**Règles proposées à confirmer :** expiration après 60 jours ; publication immédiate avec modération a posteriori. Aucun rappel automatique dans ce lot. Une annonce expirée reste visible dans l'espace de son propriétaire, qui confirme sa disponibilité pour la renouveler.

La règle de contact ci-dessus est la base du cadrage ; elle doit être confirmée avant développement. Les catégories et écrans principaux doivent également être validés.

## Hors V1

- Enchères : abandonnées.
- Paiement intégré, commissions, reversements et livraison.
- Publicité et mise en avant payante.
- Avis, commentaires, note globale et badge « fiable ».
- Dépôt financier (« deposit », sens à préciser) et vérification manuelle systématique.
- Messagerie interne, favoris, comptes professionnels et application mobile native.
- Carte et recherche par rayon géographique.

La V1 ne génère aucun revenu automatisé.

## Réception

| Parcours | Résultat à vérifier |
| --- | --- |
| Compte | Vérification d'email et récupération du mot de passe fonctionnelles |
| Propriété | Un membre ne peut ni modifier ni retirer l'annonce d'un autre, y compris par appel direct |
| Publication | Création avec photos, modification et affichage correct sur mobile et ordinateur |
| Recherche | Filtres combinables, département, tris et pagination donnent des résultats cohérents |
| Contact | Aucune coordonnée privée dans les réponses publiques ; consultation selon la règle validée |
| Partage | Lien copiable, stable et ouvrable sans connexion |
| Cycle de vie | Vendu et expiré absents des résultats actifs ; seul le propriétaire peut renouveler une annonce éligible |
| Modération | Retrait et suspension effectifs ; actions administratives tracées |
| Indicateurs | Compteurs cohérents avec les événements de recette, sans les présenter comme des ventes prouvées |

Le devis fixera la durée de recette et les modalités de correction. Toute extension au périmètre validé fera l'objet d'un chiffrage distinct.

## Mise en service

Prévoir HTTPS, contrôles d'accès, validation des photos, limitation des abus, titres SEO et sitemap. Tester la restauration des données et médias. Le client fournit les contenus, catégories, textes légaux validés et accès techniques, et désigne un responsable de modération. Les durées de conservation doivent être fixées avant ouverture.
