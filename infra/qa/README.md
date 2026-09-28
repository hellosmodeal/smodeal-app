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

## Services et secrets

| Service | Adresse |
| --- | --- |
| API Appwrite | `http://127.0.0.1:18670/v1` |
| Mailpit | `http://127.0.0.1:18672` |
| Application durant la recette | `http://localhost:18671` |

Les emails destinés aux adresses fictives `@smodeal.test` sont capturés par Mailpit. Aucune console web Appwrite n’est installée. Le réseau, les conteneurs et les volumes portent le nom `smodeal-qa`. Les ports publiés sont limités à la boucle locale.

`appwrite.local`, `console-admin.local` et `.env.qa.local` sont générés avec des secrets aléatoires, ignorés par Git et protégés en mode 600. Ne pas copier ces clés vers la production ni versionner ces fichiers. Le bootstrap conserve un fichier d’environnement existant et rejoue uniquement la création du schéma manquant.

En local, les contrôles anti-abus et le moteur antivirus sont désactivés pour la recette. Les signatures et limites des photos sont toujours contrôlées par l’application. Les fonctions, Sites et leur exécuteur ne sont pas installés : cet environnement valide les parcours Auth/TablesDB/Storage, pas l’hébergement Cloud. Les callbacks HTTP ne sont acceptés que hors production avec un backend Appwrite local ; le site local reste `noindex`.

## Arrêter

```sh
./infra/qa/down.sh
```

Cette commande ne touche que le projet Compose `smodeal-qa` et conserve ses volumes. La recette ne remplace pas les essais mobile/ordinateur, les essais de charge, la validation légale, ni les tests de sauvegarde/restauration avant lancement.
