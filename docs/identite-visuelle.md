# Identité visuelle

## Direction retenue le 28 septembre 2026

Le retour client remplace la première direction orange : **mot-symbole « Smodeal.fr » bleu, extension « .fr » grise**, sur fond clair. Le nom de marque reste **Smodeal**. La V1 vise la France.

Le logo fourni est une référence raster. La déclinaison intégrée utilise Geist Variable en graisse 800, convertie en tracés dans `public/brand/smodeal-logo.svg` : elle reste nette à toutes les tailles et ne dépend pas d'une police installée. C'est une adaptation de la référence, pas le fichier maître original du client. Le S seul sert aux formats réduits ; le symbole orange à coupes diagonales est abandonné.

## Palette et usages

| Usage | Couleur |
| --- | --- |
| Marque, boutons, liens et sélection | `#005bea` |
| Interaction renforcée | `#004dcc` |
| Extension du logo | `#737373` |
| Surface du bandeau | `#f5f8ff` |
| Surface secondaire | `#f5f7fa` |
| Accent doux | `#eaf1ff` |
| Texte principal | `#17191e` |

Le blanc sur le bleu principal et le bleu sur blanc respectent le contraste AA pour du texte courant. Les tokens sont centralisés dans `src/styles.css`. La typographie de l'interface reste Geist Variable ; la structure de l'accueil de petites annonces est conservée.

## Fichiers intégrés

- Logo et S vectoriels : `public/brand/smodeal-logo.svg`, `public/brand/smodeal-symbol.svg`.
- Exports PNG de compatibilité dans `public/brand/`.
- Favicon `.ico`, PNG 16/32 px, icône Apple 180 px, icônes Android 192/512 px.
- Image de partage `public/og-image.png`, 1200 × 630 px, avec marque `.fr` et positionnement français.

Les photos d'annonces restent des exemples fictifs. Leurs couleurs ne sont pas des couleurs de marque.

## Domaine

`smodeal.fr` devient le domaine principal cible. Au 28 septembre 2026, il redirige encore vers `smodeal.com`. Garder le domaine SEO actif en `.com` jusqu'au raccordement HTTPS du `.fr`, puis inverser la redirection et changer `PUBLIC_SITE_URL` dans Appwrite. Ne jamais publier de canonique vers un domaine qui redirige vers l'ancien site.

Voir [DESIGN.md](../DESIGN.md), [les décisions de lancement](decisions-lancement.md) et [la migration du domaine](migration-domaine-fr.md).
