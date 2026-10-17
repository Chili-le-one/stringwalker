# Stringwalker

**Francais**

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

**english**

**Barebow String Walking Calculator**

Stringwalker is a web application designed for barebow archers who want to calculate, refine, and retrieve their string-walking references at different shooting distances.

Using measurements taken with their own equipment, the application builds a tuning curve and estimates the position to use at intermediate distances. It also accounts for the geometry of the finger tab or glove, as well as terrain slopes.

**Live application:** https://chili-le-one.github.io/stringwalker/

**Source code:** https://github.com/Chili-le-one/stringwalker

---

## Features

- **String-walking calculations:** estimate the required crawl position for a given shooting distance.
- **Finger tab and glove support:** manage references using stitches and half-stitches for a tab, or fingers and millimetre-based positions for a glove.
- **Equipment profiles:** create, duplicate, rename, and delete profiles to keep different equipment setups organised.
- **On-range calibration:** correct settings based on arrow impact positions and progressively refine the results.
- **Measurement management:** record actual tested distances and corresponding crawl positions.
- **Tuning curves:** visualise measurements and compare them with the calculated curve.
- **Multiple interpolation methods:** polynomial, monotone curve, and linear interpolation.
- **Slope compensation:** account for uphill and downhill shots, estimate elevation differences, and configure correction factors.
- **Reference visualisation:** display positions on the finger tab.
- **Field mode:** a simplified interface for quickly checking and adjusting distance and slope.
- **Export and backup:** export data to CSV and save or restore profiles using JSON files.
- **Bilingual interface:** French and English.
- **Progressive Web App (PWA):** install on a compatible phone and use offline after the application has been cached.

## How does it work?

### 1. Configure your equipment

Select your finger protection type and create a profile corresponding to your bow and equipment.

**For a finger tab:**
- Enter the position of the first and last stitches in millimetres.
- Specify the number of stitches.
- Select the counting direction.

Half-stitch positions are calculated automatically.

**For a glove:**
- Measure the position of each finger individually.
- Enter the distances in millimetres relative to your chosen zero point.

Finger lengths are not assumed to be identical.

### 2. Record your reference measurements

On the shooting line, find the positions that consistently centre your arrow groups at different distances.

Record each distance and its corresponding position in millimetres. At least two different distances are required to get started. Additional measurements spread across a wider range of distances will generally help characterise your setup more accurately.

### 3. Calculate a reference

In the **Calculator** tab, enter your target distance. Stringwalker displays the estimated position in millimetres and the corresponding reference on your finger tab or glove.

The tuning curve and distance table allow you to review results at different distances.

### 4. Refine your settings

After shooting a group of arrows, use the calibration tool to correct your reference if the impacts are too high or too low.

Save your corrections and new measurements to progressively improve the consistency of your profile.

### 5. Back up your data

Use the CSV export and JSON backup features in the **Measurements** tab to preserve your records and restore them later.

**Tip:** Create regular JSON backups, especially before changing phones or browsers, or clearing browser data.

## Installing on your phone

Stringwalker can be used directly in a web browser or installed as an application on a compatible device.

- **Android:** open the website in Chrome and select "Install app" or "Add to Home screen".
- **iPhone and iPad:** open the website in Safari, tap the Share button, and select "Add to Home Screen".

To prepare for offline use, open the application while connected to the Internet and allow the initial loading process to finish.

Installation and offline availability depend on the browser and its environment.

## Data and privacy

Profiles, settings, and measurements are stored locally in the device's browser storage.

The application is designed not to collect or send this data to a server. No user account is required.

Please note that local storage is not a guaranteed backup. Clearing browser data or losing your device may result in the loss of your settings. JSON exports allow you to keep an independent copy.

## Limitations and safety

Stringwalker provides **estimates based on the archer's own measurements**. Results depend on measurement accuracy, shooting consistency, equipment, and shooting conditions.

Calculated results do not replace real-world testing. Always validate your references through actual shooting before relying on them.

Follow your club's safety rules and shooting-range procedures. Do not use your phone while at full draw or manipulate the application until the shooting area is safe.

Stringwalker is an independent project and is not officially affiliated with any sporting federation or archery equipment manufacturer.

## Technologies

- HTML
- CSS
- JavaScript
- SVG for diagrams and curves
- Web App Manifest and Service Worker for PWA functionality
- Browser local storage for user data

The application is primarily built around a standalone HTML file, with additional files required for installation and offline functionality.

## License

Stringwalker is distributed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

This license permits sharing and adaptation for non-commercial purposes, provided the license conditions are met, including appropriate attribution to the original author.

Commercial use requires separate permission from the copyright holder.

Read the full license: https://creativecommons.org/licenses/by-nc/4.0/

## Author

**Chili le one**

An independent project developed to make barebow string-walking setup and tuning easier.

---

*Stringwalker — Measure, calculate, verify, and refine your string walking.*

## Auteur

**Chili le one**

Projet personnel développé pour faciliter le réglage du pianotage en tir à l'arc barebow.

---

*Stringwalker — Mesurer, calculer, vérifier et affiner son pianotage.*
