#!/bin/bash
# Colle moi l'web — installation en une ligne (macOS), sans avertissement Gatekeeper.
# Usage côté utilisateur :
#   curl -sL https://raw.githubusercontent.com/TONPSEUDO/colle-moi-l-web/main/install.sh | bash
set -e

# >>> À ADAPTER : ton dépôt GitHub <<<
REPO="SalashPyta/colle-moi-l-web"
ZIP_URL="https://github.com/$REPO/releases/latest/download/Colle-moi-l-web.zip"

echo "=== Installation de « Colle moi l'web » ==="

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "  • Téléchargement…"
curl -fsSL "$ZIP_URL" -o "$TMP/cmw.zip"

echo "  • Décompression…"
ditto -x -k "$TMP/cmw.zip" "$TMP"
SRC="$TMP/Colle moi l'web"
# enlever toute quarantaine (par sécurité)
xattr -cr "$SRC" 2>/dev/null || true

# 1. Panneau CEP
EXT="$HOME/Library/Application Support/Adobe/CEP/extensions"
mkdir -p "$EXT"
rm -rf "$EXT/PasteFromWeb"
cp -R "$SRC/PasteFromWeb" "$EXT/PasteFromWeb"
echo "  • Panneau installé"

# 2. Mode debug CEP (extensions non signées)
for v in 9 10 11 12; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
done
echo "  • Premiere autorisé à charger le panneau"

# 3. Helper (raccourci Cmd+V)
mkdir -p "$HOME/Applications"
rm -rf "$HOME/Applications/ColleMoiWebHelper.app"
cp -R "$SRC/Helper/ColleMoiWebHelper.app" "$HOME/Applications/ColleMoiWebHelper.app"
xattr -cr "$HOME/Applications/ColleMoiWebHelper.app" 2>/dev/null || true
open "$HOME/Applications/ColleMoiWebHelper.app"
echo "  • Helper installé et lancé"

echo ""
echo "✅ Terminé !"
echo "   1. Autorise « ColleMoiWebHelper » dans Accessibilité (la fenêtre te guide)."
echo "   2. (Re)lance Premiere → Fenêtre ▸ Extensions ▸ Colle moi l'web."
echo "   3. Copie une image du web, puis Cmd+V dans la timeline."
