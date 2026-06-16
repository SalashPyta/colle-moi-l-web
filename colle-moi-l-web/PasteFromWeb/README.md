# PasteFromWeb — coller une image du web dans Premiere Pro

Panneau CEP qui prend l'image du presse-papier (bitmap **ou** URL), la télécharge
dans `<dossier du projet>/image web/`, l'importe dans un chutier **image web**, et
l'insère dans la séquence active à la tête de lecture.

## Installation

```bash
cd PasteFromWeb
sh install.sh
```

Puis dans Premiere : **Fenêtre ▸ Extensions ▸ Paste From Web**.

## Utilisation

1. Dans le navigateur : clic droit sur une image → **Copier l'image** (ou *Copier l'adresse de l'image*).
2. Dans Premiere, place la tête de lecture où tu veux l'image.
3. Clique **Coller depuis le web** dans le panneau (ou Cmd+V quand le panneau a le focus).

## Limites connues

- **Pas de Cmd+V global** : Premiere ne laisse pas une extension détourner Cmd+V de
  la timeline. Le déclencheur est le bouton (ou Cmd+V panneau focus). Pour un vrai
  raccourci global, il faudrait un helper (Hammerspoon/Keyboard Maestro) — voir plus bas.
- **WebP** : converti en PNG via `sips` (natif macOS).
- **overwriteClip** : l'image écrase ce qui est sous le playhead sur la piste cible.
  Pour pousser les clips au lieu d'écraser, remplace `overwriteClip` par `insertClip`
  dans `jsx/host.jsx`.
- macOS uniquement (lecture presse-papier via `osascript`/`pbpaste`/`sips`).

## Évolution possible : vrai Cmd+V global

Ajouter un script Hammerspoon qui, si Premiere est au premier plan et le presse-papier
contient une image, intercepte Cmd+V et appelle le panneau (via un petit serveur HTTP
Node lancé dans `main.js`). Le panneau garde toute la logique ; le helper ne fait que
déclencher.
