# État de la V1

État du code au 29 septembre 2026. Implémenté signifie présent et testé dans le dépôt ; les recettes locales ci-dessous ne prouvent pas un déploiement en production.

## Parcours implémentés

| Parcours | Réception dans le code |
| --- | --- |
| Compte | Connexion, inscription, demande de vérification, confirmation explicite du lien email, récupération générique et nouveau mot de passe ; session suspendue refusée |
| Publication | Email vérifié, six catégories, champs validés, téléphone privé obligatoire, accord d’affichage facultatif et non présélectionné, jusqu’à cinq photos JPG/PNG/WebP de 5 Mo maximum avec signature vérifiée |
| Vendeur | Liste paginée, édition des champs publics des annonces actives ou expirées, vendu, retrait, renouvellement après expiration ; propriété contrôlée côté serveur et annonce retirée par modération non réactivable |
| Découverte | Accueil, filtres, pagination et fiche SSR sur Appwrite ; aucune annonce fictive dans les résultats ; filtre actif et non expiré à chaque lecture publique |
| Contact | Demande POST d’un membre actif, accord du vendeur ou propre numéro du propriétaire ; réponse privée sans cache ; aucune coordonnée dans les données publiques |
| Modération | Signalement d’une annonce disponible par un membre distinct du vendeur ; liste paginée réservée au rôle Appwrite `admin` ; retrait ou classement avec journal transactionnel ; suspension du vendeur depuis un signalement : compte bloqué, sessions fermées, annonces actives ou expirées retirées, signalement résolu et journal `suspend_user` ; un administrateur ne peut pas être suspendu |
| Anti-abus | Compteurs privés partagés dans Appwrite, quotas par membre ou seau anonyme, réponses 429 avec délai de reprise et refus 503 en cas d’indisponibilité ; voir [les politiques](anti-abus.md) |

Routes : `/compte`, `/deposer`, `/mes-annonces`, `/annonces/$listingId/modifier`, `/recherche`, `/annonces/$listingId`, `/moderation`, `/mot-de-passe-oublie`, `/verification-email`, `/reinitialiser-mot-de-passe`.

## Choix et limites

- Recherche textuelle : plein texte Appwrite sur le titre, au moins trois caractères. Les demandes trop courtes affichent une explication sans résultats trompeurs. La ville utilise une correspondance exacte ; il n’y a pas de géolocalisation ni de recherche par rayon.
- Le consentement téléphonique est lié au vendeur : la valeur saisie lors d’un dépôt s’applique à ses annonces. Sans accord, les autres membres ne peuvent pas obtenir son numéro. Aucune messagerie intégrée.
- Expiration : exclusion immédiate des résultats après 60 jours, même si le statut stocké est encore actif. Le renouvellement est possible ; aucun traitement différé n’a été installé.
- Photos : le bucket configuré permet une lecture publique des fichiers. Un retrait masque la fiche, sans retirer automatiquement les fichiers du stockage ; conservation et nettoyage sont encore à définir. Après un résultat de commit incertain, conserver les photos évite de casser une annonce qui aurait réellement été publiée : réconciliation opérationnelle encore nécessaire.
- Édition : photos et coordonnées restent conservées ; la modification ne renouvelle pas la durée de publication. Les annonces vendues, retirées ou modérées ne sont pas modifiables.
- Suspension : le blocage du compte précède la transaction de retrait ; si celle-ci échoue, le compte reste bloqué et l’action peut être relancée. Les autres signalements ouverts sur ses annonces restent à classer. La levée de suspension (`restore_user`) n’a pas d’écran : elle se fait dans la console Appwrite et ne remet pas les annonces en ligne.
- Profil public vendeur et instrumentation des événements d’usage restent à construire.

## Avant ouverture aux vrais vendeurs

1. Recetter le déploiement et ses callbacks sur une origine HTTPS approuvée. La table privée `rate_limits` a été installée et vérifiée dans Cloud le 29 septembre ; suivre [la mise en production](mise-en-production.md). L’environnement local est décrit dans [la recette](../infra/qa/README.md).
2. Compléter les cas réseau et liens expirés, définir le responsable de modération et fournir les textes légaux validés par le responsable du projet.
3. Tester sauvegarde et restauration des données et photos ; définir réconciliation des commits incertains et purge des médias orphelins.
4. Vérifier la charge et le coût des transactions anti-abus, puis déployer la version validée et vérifier les parcours dans l’environnement distant.

Le schéma distant précédant l’ajout de `rate_limits` a été vérifié en lecture seule : ses tables, colonnes et index sont disponibles, les tables n’accordent pas de permissions client et le bucket correspond aux limites prévues. Cette vérification ne couvre pas la nouvelle table et ne remplace pas la recette des mutations et des emails.

## Recette réalisée le 28 septembre 2026

Le test opt-in de [l’environnement local](../infra/qa/README.md) a réussi sur Appwrite 2.3.0 et Mailpit réels, avec des comptes et annonces fictifs : inscription/session, email de vérification et refus de rejouer son lien, récupération du mot de passe (ancien refusé, nouveau accepté), publication PNG et transaction, lecture publique du fichier, téléphone absent du HTML public, refus d’accès d’un autre vendeur, édition sans changement des dates/photos, fiche SSR disponible puis indisponible après expiration ou modération, renouvellement, signalement, accès admin et journal de retrait.

Le refus d’afficher un téléphone sans consentement est vérifié sur un contact réellement stocké ; cette partie invoque la frontière métier avec des dépendances injectées, pas le transport HTTP de la server function. La recette n’est pas une validation complète du navigateur. Aucune mutation ni aucun email n’a été envoyé au projet Cloud.

Le bootstrap du schéma refuse toute cible distante. La récupération après perte du fichier d’environnement local a été essayée sans remplacer le fichier actuel ; une nouvelle clé locale est émise si le secret de la précédente n’est plus disponible.

## Recette réalisée le 29 septembre 2026

La recette HTTP réelle vérifie maintenant le cookie de connexion, les contacts avec et sans accord du vendeur, le refus d’une session suspendue, les fiches vendues ou retirées en 404 et la onzième tentative de connexion en 429 avec `Retry-After`, `Cache-Control: no-store` et message français. La concurrence du compteur est testée séparément : onze demandes simultanées ne peuvent accepter plus de dix opérations ; une séquence de dix passe puis la suivante est refusée.

Le navigateur local a été essayé à 1280 et 390 pixels : accueil et recherche sans débordement horizontal global, redirection vers la connexion, publication sans photo et sans consentement présélectionné, saisie de 25,50 € puis modification à 26,75 €, affichage autorisé du téléphone fictif et refus sans consentement. Les photos restent facultatives ; le fichier vide produit par un champ non renseigné est ignoré. Cette recette a également corrigé le traitement Appwrite des comptes suspendus et la comparaison des dates des compteurs.

Ces essais utilisent uniquement des comptes et annonces fictifs dans Appwrite local. La table `rate_limits` a été créée localement ; elle n’a pas été appliquée au projet Cloud par cette recette.

## Préparation Cloud du 29 septembre 2026

Après la recette locale, la table privée `rate_limits` a été créée dans le projet Cloud configuré, sans modifier les autres tables ni le bucket. Les cinq colonnes, l’index et le refus de lecture anonyme ont été vérifiés. Une transaction et sa limite d’incrément ont été essayées avec un compteur temporaire, supprimé après contrôle. Aucun compte ni email de recette n’a été créé dans Cloud. Le build de la PR est réussi. La PR a été fusionnée le 30 septembre 2026 et le site public sert la V1 ; voir [la mise en production](mise-en-production.md).

## Suspension administrative du 6 octobre 2026

La recette Appwrite locale couvre la suspension sur les vrais services : refus quand le vendeur est lui-même administrateur, puis suspension par un autre administrateur. Le compte passe au statut bloqué, sa session et sa connexion sont refusées, ses annonces passent en `removed_by_moderation`, la fiche répond 404 et le journal contient une seule entrée `suspend_user`. La clé serveur de chaque environnement doit disposer de `users.write` et `sessions.write`.

## Passe UX MVP du 8 octobre 2026 (branche `feat/mvp-ux-pass`, non fusionnée)

Implémenté et testé localement, pas encore déployé :

- Socle : écrans 404, erreur et chargement ; en-tête avec dépôt, annonces du vendeur et modération pour les administrateurs ; pied de page avec liens légaux ; boutons, champs et listes déroulantes harmonisés.
- Pages `/mentions-legales`, `/cgu`, `/confidentialite`, `/cookies` : structure prête, champs marqués « À compléter » et `noindex` tant qu’ils le restent. Les textes doivent être fournis et validés par le responsable du projet.
- `/robots.txt` et `/sitemap.xml` : le sitemap ne liste que les annonces actives non expirées et répond 404 hors domaine canonique indexable. Le site entier reste `noindex` : l’indexation est une décision à prendre avant de soumettre le sitemap.
- Découverte : carte d’annonce partagée, accueil réutilisant la recherche, catégories en liens, fenêtre de pagination, effacement des filtres, numéro affiché par paires.
- Vendeur : messages de validation en français, prix accepté avec espaces de milliers, confirmation avant « Vendu » et « Retirer », bandeaux de succès après dépôt et modification, dépôt bloqué avec explication tant que l’email n’est pas vérifié.
- Fiche : actions du propriétaire calculées côté serveur sans exposer l’identifiant du vendeur, partage, galerie, signalement guidé avec erreur sur le champ.
- Compte : email de vérification envoyé à l’inscription (échec non bloquant), redirection conservée entre connexion et inscription.
- Correctif : la confirmation du lien de vérification utilisait la clé API, refusée par Appwrite (scope `public` manquant) ; elle passe désormais par un client invité. La recette locale vérifie les deux comportements. Ce défaut existait avant la passe et touche aussi la production.

Recette navigateur par agents sur Appwrite local, en largeur ordinateur et téléphone : parcours vendeur, acheteur et modération réussis, sauf la vérification d’email. Celle-ci a été corrigée ensuite et validée par la recette Appwrite locale, pas encore rejouée dans le navigateur.

Restent hors de cette passe : profil public vendeur, modification du compte (pseudonyme, téléphone, accord), indicateurs d’usage, suppression de compte, écran de levée de suspension, purge des photos orphelines, case d’acceptation des CGU à l’inscription, noms de départements.
