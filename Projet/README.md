# Projet CAI / TOO
VELUZ Jesse et ARRUZAS Simon

## Exécuter l'application
1. Ouvrir un terminale à la racine du projet
1. **Installation des dépendances :** 
```npm install```
2. **Build :** 
```npm run build```
3. **Lancement :** Avec l'extension live server clique droit sur index.html => "open with live server"


## Fonctionnement de l'application
L'application permet à l'utilisateur de travailler avec des fichiers DMN (Decision Model and Notation) en suivant ces étapes :

1. **Chargement de Fichier DMN :** L'application prend en charge le chargement de fichiers DMN, avec la possibilité de les glisser-déposer ou de les télécharger via un bouton dédié.
2. **Saisie d'Entrée :** L'utilisateur peut saisir des données d'entrée dans des champs de formulaire générés en fonction des informations DMN.
3. **Voir les Résultats :** Les résultats de l'évaluation sont affichés dans une table, mettant en évidence les noms des décisions et les valeurs de sortie correspondantes.


## Composition de l'application

### Libraries utilisées
- `DmnModdle` : Une bibliothèque pour interagir avec des fichiers DMN au format XML.
- `DmnJS` : Une bibliothèque pour visualiser des fichiers DMN de manière graphique.
- `feelin` : Une bibliothèque utilisée pour évaluer des expressions de règles définies dans les fichiers DMN.

### Architecture du code
Cet ensemble suit le modèle de conception MVC, où le contrôleur gère les interactions, le modèle gère les données, et la vue gère l'affichage.

![`Shéma de l'Architecture`](./img/readme/architecture.png)

Voici un résumé de chaque composant du code :

#### `App_Controller.ts`
- Le contrôleur de l'application qui gère les interactions utilisateur et coordonne les actions entre le modèle (`App_Model`) et la vue (`App_View`).
- Il définit des écouteurs d'événements pour les entrées utilisateur et met à jour le modèle et la vue en conséquence.

#### `App_Model.ts`
- Le modèle de l'application qui stocke les données de l'application, notamment les informations DMN, les données d'entrée, et les résultats de l'évaluation.
- Il utilise le module `DMN` pour représenter et manipuler les données DMN.
- Il gère la sauvegarde et le chargement de l'état de l'application dans l'historique de navigation du navigateur.

#### `App_View.ts`
- La vue de l'application qui gère l'affichage des données à l'utilisateur.
- Elle Affiche en fonction des données dans le modèle.
- Elle utilise la bibliothèque DmnJS pour afficher des fichiers DMN.
- Elle génère des formulaires de saisie et des tables de résultats en fonction des données DMN et de l'entrée de l'utilisateur.

### Modules annexes
#### `DMN`
- Une classe qui encapsule la logique d'évaluation des décisions DMN.
- Elle utilise la bibliothèque `feelin` pour évaluer les expressions de règles définies dans les fichiers DMN.
- Elle effectue une évaluation récursive des décisions en fonction des dépendances entre elles.
- Elle retourne les résultats de l'évaluation des décisions en fonction des données d'entrée.