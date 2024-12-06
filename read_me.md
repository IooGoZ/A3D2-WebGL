# Algorithmie 3D 2 - Léna PROUST & Tom BOIREAU

## Description du projet

Ce projet a pour but de poursuivre l'enseignement de l'UE "Algorithmie 3D" de M1. Il s'agit d'un programme réalisé en WebGL permettant de visualiser des objets 3D. Le jalon 2, présenté ici, consiste à réaliser un lancer de rayon avec un calcul d'intersection entre un rayon et une carte de hauteur au sein d'une boite englobante.

## Fonctionnalités

- **Géométrie d'une boîte englobante :**

La boîte englobante est simplement un cube de taille 2 centré en (0,0,1) et composé de 12 triangles. L'affichage de la boîte englobante peut être activé via l'option `Wireframe` dans l'interface.

- **Lancer de rayon sur une carte de hauteur :**

Le lancer de rayon est effectué sur une carte de hauteur au sein de la boîte englobante. Cette carte est une texture de 512x512 pixels. Pour calculer l'intersection du rayon avec la carte, nous utilisons la méthode d'intersection de rayon avec un plan. Afin d'optimiser le delta t lors du calcul de l'intersection, nous avons adopté un lancer de rayon voxelisé en utilisant l'algorithme de Bresenham. Ainsi, le rayon évolue dans un espace discret de 512x512x512, ce qui réduit la précision du rendu général mais diminue les artefacts. Le fragment shader gère les calculs d'intersection et de couleur en tenant compte de la texture, de la normale (calculée à partir de la texture ou depuis une normal map), et de l'éclairage (reflet et ombre).

- **Application de plusieurs textures :**

Il est possible d'ajouter une texture en complément de la heightmap. Cette texture est colorée en fonction de la hauteur et peut être combinée avec une texture "traditionnelle" pour enrichir les variations de terrain. Le mélange des deux textures, en plus de la normal map (pour l'eau), permet un rendu plus réaliste.

- **Utilisation d'une texture couleur pour la heightmap :**

Pour une plus grande diversité visuelle, il est désormais possible d'utiliser une texture couleur pour la heightmap. Cette texture RGB de 512x512 pixels est convertie en LAB, permettant d'utiliser la luminance comme hauteur.

- **Améliorations de l'interface :**

Plusieurs améliorations ont été apportées depuis le jalon 1. Nous avons limité les angles de la caméra pour éviter qu'elle ne passe sous la scène. Un curseur a également été ajouté pour régler l'amplitude de la heightmap dans la bounding box. Enfin, nous avons inclus la possibilité de générer une heightmap colorée avec du bruit de Perlin, en générant simplement deux composantes supplémentaires avec un décalage.

## Indications techniques

- Contrairement au jalon 1 où la heightmap était chargée dès l'ouverture de la page, la bounding box n'est pas directement créée. Cela s'explique par l'utilisation de textures pour la heightmap, nécessitant un chargement préalable. Pour créer la bounding box, choisissez une heightmap dans l'interface (prédéfinie ou générée avec du bruit de Perlin) et cliquez sur le bouton `Bounding Box` à droite.

- La valeur de FOV donnée en cours n'étant pas satisfaisante, nous avons choisi de la remplacer par une formule plus adaptée calculant le FOV pour un angle donné.
