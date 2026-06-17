<div align="center">

# 🌐 Colle moi l'web

**Colle une image du web directement dans Premiere Pro, d'un simple Cmd/Ctrl+V.**

L'image est téléchargée, rangée dans `image web/` + un chutier, et posée sur une piste libre au playhead.

*Par Salash & Pytanix*

</div>

---

## 📥 Installation

### 🍎 macOS  — *recommandé : aucune alerte de sécurité*

Ouvre l'app **Terminal** et colle cette ligne, puis Entrée :

```bash
curl -sL https://raw.githubusercontent.com/SalashPyta/colle-moi-l-web/main/install.sh | bash
```

C'est tout. Une fenêtre te guidera pour autoriser le raccourci dans **Accessibilité** (comme Raycast/Rectangle).

> 💡 Pourquoi le Terminal et pas un fichier à double-cliquer ? Parce qu'un fichier
> téléchargé non signé est bloqué par macOS (« non ouvert »). La commande, elle,
> passe sans aucun blocage. C'est la méthode la plus simple et la plus fiable.

### 🪟 Windows

1. Va dans **[Releases](../../releases/latest)** → télécharge **`Installer-Windows.bat`**
2. Double-clique → si SmartScreen apparaît : **« Informations complémentaires » ▸ « Exécuter quand même »**

> ⚠️ Le raccourci Ctrl+V sous Windows nécessite **AutoHotkey v2** (gratuit), ou la version `.exe` du helper.

---

## ⌨️ Utilisation

1. Copie une image depuis ton navigateur *(clic droit ▸ Copier l'image)*
2. Place la tête de lecture dans ta timeline
3. **Cmd+V** (Mac) / **Ctrl+V** (Windows) → l'image se colle ✨

Le raccourci ne s'active **que dans Premiere** et **que si une image est copiée** — sinon le coller normal fonctionne comme d'habitude.

---

## 🔄 Mises à jour

Clique **« Vérifier les mises à jour »** en bas du panneau. S'il y a du nouveau, ça se télécharge tout seul — rien à réinstaller.

---

## ❓ « Installer-Mac.command » est bloqué (« non ouvert »)

C'est normal pour un fichier téléchargé non signé. **Utilise plutôt la commande `curl` ci-dessus** (zéro blocage). Si tu tiens au fichier : Réglages Système ▸ Confidentialité et sécurité ▸ **« Ouvrir quand même »**.
