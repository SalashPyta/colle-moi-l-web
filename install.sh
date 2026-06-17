#!/bin/bash
# Colle moi l'web — installation en une ligne (macOS).
#   curl -sL https://raw.githubusercontent.com/SalashPyta/colle-moi-l-web/main/install.sh | bash
REPO="SalashPyta/colle-moi-l-web"
ZIP_URL="https://github.com/$REPO/releases/latest/download/Colle-moi-l-web.zip"
LOG="/tmp/cmw-install.log"

# tout est journalisé dans /tmp/cmw-install.log
exec > >(tee "$LOG") 2>&1

echo "=== Installation de « Colle moi l'web » ==="
echo "macOS $(sw_vers -productVersion) · $(uname -m) · $(date)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "  • Téléchargement…"
if ! curl -fSL "$ZIP_URL" -o "$TMP/cmw.zip"; then
    echo "❌ Téléchargement échoué (réseau ?)."; exit 1
fi
echo "    zip: $(ls -lh "$TMP/cmw.zip" | awk '{print $5}')"

echo "  • Décompression…"
ditto -x -k "$TMP/cmw.zip" "$TMP" || { echo "❌ Décompression échouée."; exit 1; }
SRC="$TMP/Colle moi l'web"
if [ ! -d "$SRC" ]; then echo "❌ Contenu du zip inattendu."; ls -la "$TMP"; exit 1; fi
xattr -cr "$SRC" 2>/dev/null || true

# 1. Panneau CEP
EXT="$HOME/Library/Application Support/Adobe/CEP/extensions"
mkdir -p "$EXT"
rm -rf "$EXT/PasteFromWeb"
if cp -R "$SRC/PasteFromWeb" "$EXT/PasteFromWeb"; then
    echo "  • Panneau installé ✓"
else
    echo "❌ Copie du panneau échouée."
fi

# 2. Mode debug CEP
for v in 9 10 11 12; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
done
echo "  • Premiere autorisé à charger le panneau ✓"

# 3. Helper (raccourci Cmd+V)
APPS="$HOME/Applications"
mkdir -p "$APPS"
rm -rf "$APPS/ColleMoiWebHelper.app"
if cp -R "$SRC/Helper/ColleMoiWebHelper.app" "$APPS/ColleMoiWebHelper.app"; then
    echo "  • Helper copié dans ~/Applications ✓"
else
    echo "❌ Copie du helper échouée."
fi
xattr -cr "$APPS/ColleMoiWebHelper.app" 2>/dev/null || true

# vérifs
if [ -x "$APPS/ColleMoiWebHelper.app/Contents/MacOS/ColleMoiWebHelper" ]; then
    echo "    binaire présent: $(lipo -archs "$APPS/ColleMoiWebHelper.app/Contents/MacOS/ColleMoiWebHelper" 2>/dev/null)"
else
    echo "❌ binaire du helper introuvable après copie !"
fi

echo "  • Lancement du helper…"
open "$APPS/ColleMoiWebHelper.app" 2>&1 || echo "❌ 'open' a renvoyé une erreur"
sleep 3
if pgrep -f "ColleMoiWebHelper" >/dev/null; then
    echo "  • Helper en cours d'exécution ✓"
else
    echo "❌ Le helper ne tourne PAS après lancement (Gatekeeper ? crash ?)."
    echo "    Essaie : ouvre le Finder ▸ Aller ▸ Aller au dossier… ▸ tape  ~/Applications"
    echo "    puis double-clic sur ColleMoiWebHelper."
fi

echo ""
echo "✅ Script terminé."
echo "   1. Autorise « ColleMoiWebHelper » dans Accessibilité (la fenêtre te guide)."
echo "   2. (Re)lance Premiere → Fenêtre ▸ Extensions ▸ Colle moi l'web."
echo "   3. Copie une image, puis Cmd+V dans la timeline."
echo ""
echo "📋 Journal complet : $LOG  (et /tmp/collemoiweb.log pour le helper)"
