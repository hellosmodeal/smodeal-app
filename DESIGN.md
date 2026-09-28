# Design de Smodeal

Référence pour l'interface de la V1, mise à jour le 28 septembre 2026. Les nouveaux retours remplacent la direction orange par un mot-symbole **Smodeal.fr bleu et gris**. La structure de l'accueil et Geist Variable sont conservées. La France reste le marché de lancement. Voir les [décisions de lancement](docs/decisions-lancement.md).

## Intention

Smodeal est une place de petites annonces entre particuliers. L'accueil doit permettre de **chercher un bien immédiatement**, parcourir des catégories et voir des annonces. Il ne doit pas prendre la forme d'une page d'attente ou d'une présentation institutionnelle. L'expression de marque est simple, chaleureuse et directe : « Les belles choses circulent ».

La maquette d'accueil fournie le 27 septembre 2026 et le logo fourni dans `Downloads` ont guidé l'interface actuelle. Les autres maquettes fournies servent de références pour la suite ; elles ne signifient pas que ces écrans sont implémentés ou validés.

## État des décisions

| Sujet | État | Référence |
| --- | --- | --- |
| Nom « Smodeal », mot-symbole « Smodeal.fr » bleu et gris | Retour client appliqué le 28 septembre 2026 | [Identité visuelle](docs/identite-visuelle.md) |
| Accueil de petites annonces : recherche, catégories, annonces, invitation à vendre | Implémenté avec des données fictives | `src/routes/index.tsx` |
| Palette et Geist Variable | Validés et intégrés | `src/styles.css` |
| Logo et S vectoriels | Déclinaison en tracés intégrée ; variantes complémentaires à préparer | `public/brand/` |
| Six catégories V1 et annonces réelles | Catégories retenues, données réelles à raccorder | [Périmètre V1](docs/perimetre-v1.md) |

## Marque et assets

- Nom affiché : **Smodeal**, jamais « Smodial ».
- Logo : mot complet « Smodeal » bleu, extension « .fr » grise, graisse 800. Utiliser le S typographique seul en petit format.
- `public/brand/smodeal-logo.svg` et `public/brand/smodeal-symbol.svg` sont des tracés vectoriels réalisés à partir de Geist, d'après la référence client. Les PNG sont des exports de compatibilité. `public/og-image.png` sert aux aperçus de partage.
- Garder les proportions du logo et un espace libre autour. L'en-tête utilise une largeur de 112 px sur mobile et 176 px sur grand écran. Les autres variantes devront être vérifiées dans leur contexte.
- Ne pas agrandir les petits exports raster pour en faire un logo principal.

## Système visuel validé

Les valeurs ci-dessous sont validées pour la V1 ; la source technique est `src/styles.css`.

| Usage | Valeur actuelle | Rôle |
| --- | --- | --- |
| Fond principal | `#ffffff` | Surface de lecture et cartes |
| Bandeau d'accueil | `#f5f8ff` | Surface claire bleutée, sans concurrencer les annonces |
| Texte principal | `#17191e` | Titres, prix, navigation et contraste |
| Bleu de marque | `#005bea` | Logo, boutons, texte de lien, repère actif, focus et icônes |
| Bleu renforcé | `#004dcc` | Interaction renforcée et accents |
| Gris du logo | `#737373` | Extension « .fr » |
| Surface secondaire | `#f5f7fa` | Regroupement discret |
| Texte secondaire | `#6b7280` | Métadonnées et descriptions |
| Bordure | `#dde0e5` | Champs et séparations |

Geist Variable est utilisée pour le texte et les titres. Les titres sont denses et affirmés ; les informations d'annonce restent faciles à parcourir. La largeur maximale de contenu est `max-w-7xl` avec des marges latérales adaptées au mobile. Les champs de recherche et leur bouton ont actuellement une hauteur minimale de 48 px ; les surfaces courantes ont un rayon proche de 10 px. Ces repères guident les nouveaux écrans de la V1.

Le bleu signale une action ou une sélection. Le blanc sur `#005bea` et le bleu sur blanc atteignent le contraste AA pour du texte courant ; le survol assombrit légèrement les boutons. Les prix et titres restent anthracite. Éviter d'utiliser la couleur seule pour exprimer un état : ajouter un libellé, une icône ou un état accessible.

## Principes d'interface

1. **Montrer les biens avant le discours de marque.** Sur l'accueil, la recherche et les annonces doivent être visibles rapidement.
2. **Aider à décider.** Une carte annonce présente d'abord la photo, puis le titre, le prix et le lieu. Le prix est immédiatement repérable.
3. **Rester sobre.** Fonds clairs, bordures discrètes, peu d'effets et une seule action bleue dominante par zone.
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

La grille passe d'une colonne sur mobile à deux sur tablette et quatre sur grand écran. Les champs de recherche s'empilent sur mobile. Les annonces affichées sont **des exemples fictifs** ; les filtres agissent seulement sur cet échantillon. Le formulaire de recherche et le lien « Voir toutes les annonces » ouvrent la page de résultats `/recherche`.

## Écrans à décliner

| Écran | Direction attendue | État |
| --- | --- | --- |
| Résultats de recherche | Reprendre barre de recherche, catégories, filtres, tri et cartes ; montrer le nombre de résultats et l'état vide | Implémenté avec des données fictives (`src/routes/recherche.tsx`) |
| Détail d'une annonce | Photos et titre au premier plan, prix et lieu lisibles, informations vendeur et action de contact protégée | À construire |
| Dépôt d'annonce | Formulaire progressif et clair : catégorie, description, prix, lieu, photos, vérification avant publication | À construire selon les décisions de lancement |
| Connexion et inscription | Reprendre logo, typographie, couleurs, champs et états d'erreur du système | Routes fonctionnelles, habillage à rapprocher des maquettes |
| Compte et annonces du vendeur | Accès aux annonces, statut et actions de gestion sans ambiguïté | Route de compte initiale ; reste à construire |

Les maquettes reçues pour ces écrans sont des références de composition. Vérifier chaque écran contre les parcours réels, les règles métier et les données disponibles avant de le déclarer terminé.

## Images et contenu

Les photos actuelles dans `public/images/` illustrent des annonces fictives. À l'arrivée de vraies annonces, conserver des photos nettes, non déformées, cadrées pour montrer le bien et accompagnées d'un texte alternatif utile. Prévoir un visuel de remplacement quand aucune photo n'est disponible. Ne jamais présenter les exemples comme des biens réellement en vente.

Rédiger en français courant : verbes d'action courts, catégories compréhensibles, montants en euros et lieux lisibles. Les coordonnées privées du vendeur ne doivent pas apparaître dans une fiche publique.

## Livrables et décisions encore ouverts

- Variantes monochromes et sur fond sombre du logo, vérification des tailles et marges d'usage.
- Vérification des contrastes sur chaque nouvel écran.
- Implémentation du formulaire commun avec les catégories retenues dans les décisions de lancement.
- Maquettes des résultats, du détail, du dépôt, de l'authentification et du compte après confrontation aux parcours V1.
- Images réelles, règles de modération visuelle et visuels de remplacement.

Lorsqu'un autre choix est confirmé, mettre à jour ce document, [l'identité visuelle](docs/identite-visuelle.md) et les tokens de `src/styles.css` ensemble.
