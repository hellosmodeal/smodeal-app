# Recette locale isolée

Cet environnement utilise Appwrite 2.3.0 et Mailpit sur le poste. Il est distinct du projet Appwrite Cloud et ne contient que des comptes et annonces fictifs. Docker Compose, Node 24, pnpm et les dépendances du dépôt doivent être disponibles.

## Démarrer et tester

Depuis la racine du dépôt :

```sh
./infra/qa/up.sh
./infra/qa/bootstrap.sh
./scripts/qa-check.sh
```

Le premier démarrage télécharge une image Appwrite volumineuse. `up.sh` attend que les services soient prêts. Le bootstrap crée le projet `smodeal-qa`, sa plateforme localhost, une clé locale et les tables/index/bucket à partir du schéma déclaratif du dépôt. Il ignore les références Cloud du fichier de configuration. Les ressources existantes sont conservées ; ce script ne met pas à jour ni ne supprime les colonnes déjà créées.

La recette démarre son propre serveur sur `127.0.0.1:18671`, puis l’arrête. Elle refuse un port déjà occupé et toute configuration hors du projet local attendu. Elle teste les services réels sans mocks : inscription, réception des emails et confirmation, refus de réutiliser un lien de vérification, photo publique, publication transactionnelle, droits du vendeur, édition sans renouvellement implicite, expiration, renouvellement, fiche SSR, confidentialité du téléphone, modération et journal, récupération du mot de passe.

La CI ordinaire saute ce test externe. Pour l’exécuter, utiliser `qa-check.sh` ; le drapeau `SMODEAL_QA=1` et les contrôles d’origine empêchent les mutations accidentelles vers Cloud. Les données fictives restent dans les volumes locaux pour inspection ; aucune donnée de production n’est copiée.

La recette HTTP couvre aussi le cookie de connexion, l’accord et le refus du contact, les sessions suspendues, les fiches vendues/retirées en 404 et le dépassement du quota de connexion avec ses en-têtes. Si un serveur de recette lancé avec `.env.qa.local` est déjà actif sur 18671, utiliser explicitement `SMODEAL_QA_REUSE_SERVER=1 ./scripts/qa-check.sh` : il sera conservé.

Si `.qa-browser.local` est absent, le script crée automatiquement les fixtures avec un mot de passe aléatoire non affiché. Un fichier existant est conservé. Il valide l’endpoint, le projet et la base locale avant de lancer les services ou les tests.

Pour les essais navigateur, fournir un mot de passe fictif via `QA_BROWSER_PASSWORD`, puis lancer `SMODEAL_QA=1 node --env-file=.env.qa.local --experimental-strip-types scripts/qa-seed.server.ts --write`. Le script refuse toute cible distante et crée des comptes et annonces de recette. `.qa-browser.local` contient les identifiants générés en mode 600 et est ignoré par Git. Ne pas copier ni publier son contenu.

La concurrence du compteur se vérifie séparément avec `SMODEAL_QA=1 node --env-file=.env.qa.local node_modules/vitest/vitest.mjs run src/features/abuse`.

## Services et secrets

| Service | Adresse |
| --- | --- |
| API Appwrite | `http://127.0.0.1:18670/v1` |
| Mailpit | `http://127.0.0.1:18672` |
| Application durant la recette | `http://localhost:18671` |

Les emails destinés aux adresses fictives `@smodeal.test` sont capturés par Mailpit. Aucune console web Appwrite n’est installée. Le réseau, les conteneurs et les volumes portent le nom `smodeal-qa`. Les ports publiés sont limités à la boucle locale.

`appwrite.local`, `console-admin.local` et `.env.qa.local` sont générés avec des secrets aléatoires, ignorés par Git et protégés en mode 600. Ne pas copier ces clés vers la production ni versionner ces fichiers. Le bootstrap conserve un fichier d’environnement existant et rejoue uniquement la création du schéma manquant.

En local, les contrôles anti-abus propres à Appwrite et le moteur antivirus sont désactivés pour la recette. Le limiteur de l’application, les signatures et limites des photos restent actifs. Les fonctions, Sites et leur exécuteur ne sont pas installés : cet environnement valide les parcours Auth/TablesDB/Storage, pas l’hébergement Cloud. Les callbacks HTTP ne sont acceptés que hors production avec un backend Appwrite local ; le site local reste `noindex`.

## Arrêter

```sh
./infra/qa/down.sh
```

Cette commande ne touche que le projet Compose `smodeal-qa` et conserve ses volumes. La recette ne remplace pas les essais mobile/ordinateur, les essais de charge, la validation légale, ni les tests de sauvegarde/restauration avant lancement.
