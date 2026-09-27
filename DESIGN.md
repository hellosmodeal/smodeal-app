# Design de Smodeal

Référence pour l'interface de la V1, au 27 septembre 2026. La direction visuelle actuelle a été validée : logo, palette, typographie et principes de l'accueil. Les écrans à construire et les livrables de marque encore nécessaires sont distingués ci-dessous.

## Intention

Smodeal est une place de petites annonces entre particuliers. L'accueil doit permettre de **chercher un bien immédiatement**, parcourir des catégories et voir des annonces. Il ne doit pas prendre la forme d'une page d'attente ou d'une présentation institutionnelle. L'expression de marque est simple, chaleureuse et directe : « Les belles choses circulent ».

La maquette d'accueil fournie le 27 septembre 2026 et le logo fourni dans `Downloads` ont guidé l'interface actuelle. Les autres maquettes fournies servent de références pour la suite ; elles ne signifient pas que ces écrans sont implémentés ou validés.

## État des décisions

| Sujet | État | Référence |
| --- | --- | --- |
| Nom « Smodeal » et symbole S orange suivi de « modeal » | Direction validée | [Identité visuelle](docs/identite-visuelle.md) |
| Accueil de petites annonces : recherche, catégories, annonces, invitation à vendre | Implémenté avec des données fictives | `src/routes/index.tsx` |
| Palette et Geist Variable | Validés et intégrés | `src/styles.css` |
| Logo et symbole vectoriels, variantes et règles d'espacement | À produire | [Feuille de route](docs/feuille-de-route.md) |
| Catégories finales et annonces réelles | À définir et à raccorder | [Périmètre V1](docs/perimetre-v1.md) |

## Marque et assets

- Nom affiché : **Smodeal**, jamais « Smodial ».
- Logo : symbole S orange à formes épaisses et coupes diagonales, suivi de « modeal » anthracite. Ne pas répéter le S dans le texte.
- `public/brand/smodeal-logo.png` est le logo raster de référence actuellement utilisé. `public/brand/smodeal-symbol.png` et les icônes dans `public/` déclinent le symbole pour les petits formats. `public/og-image.png` sert aux aperçus de partage.
- Garder les proportions du logo, un espace libre autour du symbole et une version lisible sur fond clair. Les dimensions minimales, variantes sombres et versions monochromes seront fixées avec le logo vectoriel final.
- Ne pas agrandir les petits exports raster pour en faire un logo principal.

## Système visuel validé

Les valeurs ci-dessous sont validées pour la V1 ; la source technique est `src/styles.css`.

| Usage | Valeur actuelle | Rôle |
| --- | --- | --- |
| Fond principal | `#ffffff` | Surface de lecture et cartes |
| Bandeau d'accueil | `#faf7f2` | Accueil chaleureux, sans concurrencer les annonces |
| Texte principal | `#17191e` | Titres, prix, navigation et contraste |
| Orange de marque | `#ff4b1f` | Action principale et repère actif |
| Orange d'interaction | `#ca3510` | Survol et contraste sur fond clair |
| Surface secondaire | `#f6f4f1` | Regroupement discret |
| Texte secondaire | `#6b7280` | Métadonnées et descriptions |
| Bordure | `#dde0e5` | Champs et séparations |

Geist Variable est utilisée pour le texte et les titres. Les titres sont denses et affirmés ; les informations d'annonce restent faciles à parcourir. La largeur maximale de contenu est `max-w-7xl` avec des marges latérales adaptées au mobile. Les champs de recherche et leur bouton ont actuellement une hauteur minimale de 48 px ; les surfaces courantes ont un rayon proche de 10 px. Ces repères guident les nouveaux écrans de la V1.

L'orange signale une action ou une sélection. Les prix et titres restent anthracite pour préserver la hiérarchie. Éviter d'utiliser la couleur seule pour exprimer un état : ajouter un libellé, une icône ou un état accessible.

## Principes d'interface

1. **Montrer les biens avant le discours de marque.** Sur l'accueil, la recherche et les annonces doivent être visibles rapidement.
2. **Aider à décider.** Une carte annonce présente d'abord la photo, puis le titre, le prix et le lieu. Le prix est immédiatement repérable.
3. **Rester sobre.** Fonds clairs, bordures discrètes, peu d'effets et une seule action orange dominante par zone.
4. **Rendre les états explicites.** Recherche vide, chargement, erreur, absence de résultat, succès de publication et annonce indisponible doivent être compréhensibles en français.
5. **Préserver l'accès.** Navigation clavier, focus visible, labels de champs, alternatives textuelles, contraste et zones tactiles confortables sont requis sur chaque écran.

## Accueil actuel

Ordre de lecture et comportement de la page implémentée :

1. En-tête avec logo, navigation et accès au compte ou à la connexion.
2. Bandeau court : « Votre prochaine trouvaille est ici. » et sous-titre d'achat/vente entre particuliers.
3. Recherche par mot-clé et lieu, suivie d'un bouton « Rechercher ».
4. Barre de catégories horizontale, défilable sur petit écran, avec sélection visible.
5. Grille des dernières annonces, filtres de prix et tri. Une carte montre photo, titre, prix, ville et ancienneté.
6. État sans résultat avec une action pour effacer les filtres.
7. Invitation à créer un compte pour vendre, puis pied de page.

La grille passe d'une colonne sur mobile à deux sur tablette et quatre sur grand écran. Les champs de recherche s'empilent sur mobile. Les annonces affichées sont **des exemples fictifs** ; les filtres agissent seulement sur cet échantillon. Le bouton « Voir toutes les annonces » remet ces filtres à zéro tant que la vraie route de consultation n'existe pas.

## Écrans à décliner

| Écran | Direction attendue | État |
| --- | --- | --- |
| Résultats de recherche | Reprendre barre de recherche, catégories, filtres, tri et cartes ; montrer le nombre de résultats et l'état vide | À construire |
| Détail d'une annonce | Photos et titre au premier plan, prix et lieu lisibles, informations vendeur et action de contact protégée | À construire |
| Dépôt d'annonce | Formulaire progressif et clair : catégorie, description, prix, lieu, photos, vérification avant publication | À construire ; champs et catégories à confirmer |
| Connexion et inscription | Reprendre logo, typographie, couleurs, champs et états d'erreur du système | Routes fonctionnelles, habillage à rapprocher des maquettes |
| Compte et annonces du vendeur | Accès aux annonces, statut et actions de gestion sans ambiguïté | Route de compte initiale ; reste à construire |

Les maquettes reçues pour ces écrans sont des références de composition. Vérifier chaque écran contre les parcours réels, les règles métier et les données disponibles avant de le déclarer terminé.

## Images et contenu

Les photos actuelles dans `public/images/` illustrent des annonces fictives. À l'arrivée de vraies annonces, conserver des photos nettes, non déformées, cadrées pour montrer le bien et accompagnées d'un texte alternatif utile. Prévoir un visuel de remplacement quand aucune photo n'est disponible. Ne jamais présenter les exemples comme des biens réellement en vente.

Rédiger en français courant : verbes d'action courts, catégories compréhensibles, montants en euros et lieux lisibles. Les coordonnées privées du vendeur ne doivent pas apparaître dans une fiche publique.

## Livrables et décisions encore ouverts

- Fichiers vectoriels du logo et du symbole, variantes clair/sombre et règles d'espacement.
- Vérification des contrastes et déclinaison des styles validés sur l'ensemble des écrans.
- Catégories et champs du formulaire de dépôt.
- Maquettes des résultats, du détail, du dépôt, de l'authentification et du compte après confrontation aux parcours V1.
- Images réelles, règles de modération visuelle et visuels de remplacement.

Lorsqu'un autre choix est confirmé, mettre à jour ce document, [l'identité visuelle](docs/identite-visuelle.md) et les tokens de `src/styles.css` ensemble.
