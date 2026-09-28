# Migration vers smodeal.fr

## État observé le 28 septembre 2026

`https://smodeal.fr/` renvoie une redirection temporaire HTTP 302 vers `https://smodeal.com`. Le domaine actif et indexable reste donc le `.com`. La nouvelle marque `.fr` est intégrée aux visuels, mais la migration du domaine n'est pas encore effectuée.

## Séquence de migration

1. Ajouter `smodeal.fr` et sa variante `www` au site Appwrite, relever les cibles DNS exactes indiquées par Appwrite.
2. Dans le gestionnaire du domaine, remplacer la redirection actuelle par les enregistrements nécessaires. Préserver les enregistrements d'email et les autres services ; ne pas remplacer l'ensemble de la zone DNS.
3. Attendre la validation DNS et le certificat HTTPS. Vérifier que le `.fr` sert directement les pages, les assets et les fonctions serveur.
4. Configurer `PUBLIC_SITE_URL=https://smodeal.fr` sur le site de production et déployer. Vérifier la canonique `.fr`, les métadonnées de partage et l'indexation de l'accueil. Les résultats de démo et les pages privées restent en `noindex`.
5. Configurer des redirections permanentes du `.com` et des variantes `www` vers le `.fr`, en conservant chemin et paramètres. Éviter toute boucle `.fr` → `.com` → `.fr`.
6. Vérifier connexion, cookies, déconnexion et URLs de vérification d'email/récupération du mot de passe sur le nouveau domaine. Les sessions de l'ancien domaine ne sont pas supposées se transférer.

## Vérifications de réception

- `/`, `/recherche`, favicon et image Open Graph accessibles en HTTPS sur `.fr`.
- Accueil : une canonique `https://smodeal.fr/`, balise robots indexable ; autres hôtes de prévisualisation hors indexation.
- Liens `.com` profonds redirigés vers le chemin correspondant, sans perte des filtres de recherche.
- Aucun changement DNS d'email ni secret versionné.

Le code SEO utilise déjà `PUBLIC_SITE_URL` et vérifie l'hôte : aucune réécriture du système SEO n'est nécessaire pour changer de domaine.
