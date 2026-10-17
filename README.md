# Stringwalker

**Calculateur de pianotage pour arc barebow (string walking)**

Stringwalker est une application web conçue pour les archers barebow qui souhaitent calculer, affiner et retrouver leurs repères de pianotage en fonction de la distance de tir.

À partir de mesures réalisées avec son propre matériel, l'application établit une courbe de réglage et estime la position à utiliser aux distances intermédiaires. Elle prend en compte la géométrie de la palette ou du gant, ainsi que la pente du terrain.

**Application en ligne :** https://chili-le-one.github.io/stringwalker/

**Code source :** https://github.com/Chili-le-one/stringwalker

---

## Fonctionnalités

- **Calcul du pianotage** : estimation de la position à utiliser en fonction de la distance de tir.
- **Palette ou gant** : gestion des repères par coutures et demi-coutures pour la palette, ou par doigts et positions en millimètres pour le gant.
- **Profils de matériel** : création, duplication, renommage et suppression de profils pour conserver différents réglages.
- **Calibration sur le terrain** : correction du réglage en fonction de l'impact des flèches, avec ajustement progressif.
- **Gestion des mesures** : enregistrement des distances et positions réellement testées.
- **Courbes de réglage** : visualisation des mesures et comparaison avec la courbe calculée.
- **Plusieurs méthodes d'interpolation** : polynomiale, courbe monotone ou linéaire.
- **Prise en compte des pentes** : montée, descente, estimation du dénivelé et corrections personnalisables.
- **Aperçu des repères** : visualisation des positions sur la palette.
- **Mode terrain** : interface simplifiée pour consulter et ajuster rapidement la distance et la pente.
- **Export et sauvegarde** : export CSV et sauvegarde/restauration des profils au format JSON.
- **Interface bilingue** : français et anglais.
- **Application web progressive (PWA)** : installation sur un téléphone compatible et utilisation hors ligne après mise en cache.

## Comment ça fonctionne ?

### 1. Configurer son matériel

Choisissez le type de protection des doigts et créez un profil correspondant à votre arc et à votre équipement.

**Avec une palette :**
- Indiquez la position de la première couture et de la dernière, en millimètres.
- Renseignez le nombre de coutures.
- Choisissez le sens de comptage.

Les demi-coutures sont calculées automatiquement.

**Avec un gant :**
- Mesurez individuellement la position de chaque doigt.
- Renseignez les distances en millimètres à partir du zéro choisi.

Les doigts ne sont pas supposés avoir tous la même taille.

### 2. Enregistrer ses mesures de référence

Sur le pas de tir, recherchez les positions qui permettent de centrer les impacts à plusieurs distances.

Enregistrez chaque distance et la position correspondante en millimètres. Deux distances différentes sont nécessaires pour commencer ; plusieurs mesures réparties sur une plage de distances plus large permettent généralement de mieux caractériser le réglage.

### 3. Calculer un repère

Dans l'onglet **Calcul**, indiquez la distance souhaitée. Stringwalker affiche la position estimée en millimètres et le repère correspondant sur la palette ou le gant.

La courbe et la table de tir permettent de consulter les résultats pour différentes distances.

### 4. Affiner le réglage

Après avoir tiré quelques flèches, utilisez l'outil de calibration pour corriger le repère si les impacts sont trop hauts ou trop bas.

Enregistrez les corrections et les nouvelles mesures afin d'améliorer progressivement la cohérence du profil.

### 5. Sauvegarder ses données

Utilisez les fonctions d'export CSV et de sauvegarde JSON dans l'onglet **Mesures** pour conserver vos relevés et pouvoir les restaurer ultérieurement.

**Conseil :** effectuez régulièrement une sauvegarde JSON, notamment avant de changer de téléphone, de navigateur ou d'effacer les données du site.

## Installation sur téléphone

Stringwalker peut être utilisé directement depuis son navigateur ou installé comme une application sur un appareil compatible.

- **Android :** ouvrez le site avec Chrome, puis choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- **iPhone et iPad :** ouvrez le site avec Safari, touchez le bouton de partage, puis choisissez « Sur l'écran d'accueil ».

Pour préparer le fonctionnement hors ligne, ouvrez d'abord l'application avec une connexion Internet et laissez le chargement initial se terminer.

La disponibilité de l'installation et du mode hors ligne dépend du navigateur et de son environnement.

## Données et confidentialité

Les profils, réglages et mesures sont enregistrés localement dans le stockage du navigateur de l'appareil.

L'application est conçue pour ne pas collecter ni envoyer ces données vers un serveur. Aucun compte utilisateur n'est nécessaire.

Attention : le stockage local n'est pas une sauvegarde garantie. Une suppression des données du navigateur ou une perte de l'appareil peut entraîner la perte des réglages. Les exports JSON permettent de conserver une copie indépendante.

## Limites et sécurité

Stringwalker fournit des **estimations basées sur les mesures de l'archer**. Les résultats dépendent notamment de la qualité des mesures, de la régularité du tir, du matériel utilisé et des conditions rencontrées.

Les résultats calculés ne remplacent pas une vérification réelle sur le terrain. Validez toujours les repères par des essais de tir avant de vous y fier.

Respectez les règles de sécurité du club et du pas de tir. Ne consultez pas votre téléphone en position de tir et ne manipulez l'application que lorsque la zone de tir est sécurisée.

Stringwalker est un projet indépendant, sans affiliation officielle à une fédération sportive ni à un fabricant de matériel de tir à l'arc.

## Technologies

- HTML
- CSS
- JavaScript
- SVG pour les schémas et les courbes
- Web App Manifest et Service Worker pour les fonctionnalités PWA
- Stockage local du navigateur pour les données utilisateur

L'application est principalement constituée d'un fichier HTML autonome et de fichiers complémentaires nécessaires à son installation et à son fonctionnement hors ligne.

## Licence

Stringwalker est distribué sous licence **Creative Commons Attribution – Pas d’Utilisation Commerciale 4.0 International (CC BY-NC 4.0)**.

Cette licence autorise notamment le partage et l'adaptation à des fins non commerciales, sous réserve de respecter les conditions de la licence, notamment l'attribution de l'auteur.

Toute utilisation commerciale nécessite une autorisation distincte du titulaire des droits.

Consulter le texte de la licence : https://creativecommons.org/licenses/by-nc/4.0/deed.fr

## Auteur

**Chili le one**

Projet personnel développé pour faciliter le réglage du pianotage en tir à l'arc barebow.

---

*Stringwalker — Mesurer, calculer, vérifier et affiner son pianotage.*
