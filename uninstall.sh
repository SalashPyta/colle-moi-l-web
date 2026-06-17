#!/bin/bash
# Colle moi l'web — désinstallation propre (macOS).
#   curl -sL https://raw.githubusercontent.com/SalashPyta/colle-moi-l-web/main/uninstall.sh | bash
echo "=== Désinstallation de « Colle moi l'web » ==="

# 1. arrêter le helper
if pkill -f "ColleMoiWebHelper" 2>/dev/null; then echo "  • Helper arrêté ✓"; else echo "  • Helper non lancé"; fi

# 2. retirer le lancement auto à l'ouverture de session (best-effort)
osascript -e 'tell application "System Events" to delete login item "ColleMoiWebHelper"' 2>/dev/null || true

# 3. supprimer l'app
rm -rf "$HOME/Applications/ColleMoiWebHelper.app" && echo "  • App supprimée (~/Applications) ✓"

# 4. supprimer le panneau
rm -rf "$HOME/Library/Application Support/Adobe/CEP/extensions/PasteFromWeb" && echo "  • Panneau supprimé ✓"

# 5. réinitialiser l'autorisation Accessibilité (repart à neuf pour un futur test)
tccutil reset Accessibility com.sacha.collemoiweb.helper 2>/dev/null && echo "  • Autorisation Accessibilité réinitialisée ✓"

# 6. nettoyer les journaux
rm -f /tmp/collemoiweb.log /tmp/cmw-install.log

echo ""
echo "✅ Désinstallé proprement. (Le mode debug CEP reste activé — inoffensif.)"
echo "   Pense aussi à retirer ColleMoiWebHelper de Réglages ▸ Confidentialité ▸ Accessibilité s'il y figure encore."
