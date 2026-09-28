# Décisions de lancement

Décisions retenues le 28 septembre 2026, dans le cadre de la demande d'appliquer les retours et de choisir une V1 viable. Elles guident la suite ; leur présence dans ce document ne signifie pas que les fonctions sont déjà développées.

## Priorité : valider l'usage en France

La V1 reste française : euros, communes, codes postaux et départements. L'acquisition est concentrée sur une première zone pour augmenter les chances qu'une recherche trouve des biens proches. La zone pilote reste à choisir selon les vendeurs que l'équipe peut réellement mobiliser. Le site peut accueillir des annonces ailleurs en France ; aucune ouverture internationale n'est prévue avant validation de l'usage et des moyens d'exploitation.

La marque publique devient Smodeal.fr. Le `.com` est conservé pour redirection après migration, et pourra servir à une expansion future. L'extension du domaine ne décide pas à elle seule des pays desservis.

## Choix fonctionnels pour la première version

| Sujet | Décision retenue | État |
| --- | --- | --- |
| Catégories | Maison, Multimédia, Mode, Loisirs, Enfants, Jardin ; un formulaire commun | Présentes dans la démo, publication réelle à construire |
| Formulaire | Titre, description, catégorie, état, prix, commune, code postal, département, jusqu'à 5 photos | À construire |
| Compte vendeur | Email vérifié avant publication ; téléphone requis et stocké séparément des données publiques | À construire et vérifier |
| Contact | Téléphone accessible sur demande à un membre connecté, avec accord explicite du vendeur ; jamais dans les réponses publiques | À construire |
| Publication | Immédiate après validation des champs et photos ; signalement et retrait administratif dès l'ouverture aux vrais vendeurs | À construire |
| Durée | 60 jours ; renouvellement par le propriétaire après confirmation de disponibilité | À construire |
| Vente | Le vendeur marque vendu ; retrait des résultats actifs | À construire |
| Paiement | Échange entre particuliers, sans paiement ni commission intégrés en V1 | Hors périmètre |

## Ordre des prochains lots

1. Compléter vérification d'email et récupération du mot de passe, vérifier l'isolation du compte vendeur.
2. Publier une annonce réelle avec photos, l'afficher et la gérer depuis le compte ; appliquer les permissions serveur.
3. Raccorder accueil et recherche aux données réelles, ajouter la fiche publique et le contact protégé. Retirer les exemples de la production au raccordement.
4. Activer signalement, retrait administratif, expiration et renouvellement avant ouverture à de vrais vendeurs.
5. Recette mobile/ordinateur, restauration des données et photos, limites anti-abus et documents légaux fournis par le responsable du projet.

## Mesurer la viabilité

Suivre les annonces actives réelles, les recherches sans résultat, les demandes de contact, le délai avant un premier contact, les vendeurs qui reviennent, les retraits déclarés vendus et le volume de signalements. Une demande de contact ne prouve pas une vente.

Comparer ces usages au coût réel d'hébergement, de stockage, d'acquisition et au temps de modération. Ne pas fixer de seuils financiers sans budget ni volume observés. Une expérimentation géographique et sa période d'observation doivent être définies avant d'acheter du trafic.

Les mises en avant payantes pourront être étudiées après démonstration d'une offre active et de demandes de contact récurrentes. Paiement intégré, avis, badges, messagerie et multiplication des pays restent différés pour maîtriser le coût et la charge d'exploitation.

## Décisions encore nécessaires

- Accès au gestionnaire DNS pour migrer le `.fr`.
- Zone pilote, responsable de modération, budget disponible et période d'observation.
- Comptes et environnements Appwrite de développement/production, sauvegardes et email.
- Textes légaux, durées de conservation et processus de traitement des signalements : validation par le responsable du projet avant ouverture.
