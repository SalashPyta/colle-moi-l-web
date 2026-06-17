# Colle moi l'web — installation & partage

Coller une image du web dans Premiere Pro (2023+) d'un simple **Cmd+V** (Mac) /
**Ctrl+V** (Windows) dans la timeline : l'image est téléchargée, rangée dans
`<projet>/image web/` et dans un chutier **image web**, puis posée sur une piste
libre au niveau de la tête de lecture.

## Installation

### macOS
1. Double-clique **`Installer-Mac.command`**
   *(si « développeur non identifié » : clic droit ▸ Ouvrir)*
2. Autorise **ColleMoiWebHelper** dans Accessibilité (la fenêtre te guide)
3. (Re)lance Premiere ▸ Fenêtre ▸ Extensions ▸ **Colle moi l'web**

### Windows  ⚠️ écrit mais NON encore testé
1. Double-clique **`Installer-Windows.bat`**
2. (Re)lance Premiere ▸ Fenêtre ▸ Extensions ▸ **Colle moi l'web**

> Le raccourci **Ctrl+V** sous Windows utilise `Windows/ColleMoiWebHelper.ahk`.
> Pour une version **sans rien installer**, compile ce script en `.exe` avec
> **Ahk2Exe** (AutoHotkey v2) sur une machine Windows, place
> `ColleMoiWebHelper.exe` dans le dossier `Windows/`, et l'installeur l'utilisera
> automatiquement. Sinon il faut **AutoHotkey v2** installé.

## Comment ça marche (3 morceaux)

- **Panneau CEP** (`PasteFromWeb/`) — toute la logique : lecture presse-papier
  (bitmap ou URL), téléchargement, import, piste libre, mise à l'échelle.
  Cross-platform (macOS via `osascript`/`sips`, Windows via PowerShell).
- **Helper Cmd/Ctrl+V** — intercepte le coller SEULEMENT si Premiere est devant
  ET qu'une image est dans le presse-papier (sinon coller natif).
  Mac : `Helper/ColleMoiWebHelper.app` (Swift). Windows : `Windows/*.ahk`.
- **Pont** — le helper ping `http://127.0.0.1:48295/paste`, le panneau fait le collage.

## Limites connues
- Le panneau doit être **ouvert** dans Premiere pour que le raccourci fonctionne
  (c'est lui qui héberge le serveur local).
- macOS : autorisation **Accessibilité** obligatoire (comme Raycast/Rectangle).
- Windows : **non testé**, à valider sur un PC.
