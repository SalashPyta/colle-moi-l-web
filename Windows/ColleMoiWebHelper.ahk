#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent
; =====================================================================
;  Colle moi l'web — helper Windows
;  Intercepte Ctrl+V dans Premiere Pro SEULEMENT si une image est dans
;  le presse-papier, et ping le panneau (serveur local) pour coller.
;  Sinon, le Ctrl+V natif de Premiere passe normalement.
;  >>> NON TESTÉ : à valider sur une machine Windows. <<<
; =====================================================================

TriggerURL := "http://127.0.0.1:48295/paste"

; CF_BITMAP = 2, CF_DIB = 8  -> une image est-elle présente ?
ClipboardHasImage() {
    return DllCall("IsClipboardFormatAvailable", "uint", 2)
        || DllCall("IsClipboardFormatAvailable", "uint", 8)
}

FireTrigger(*) {
    try {
        req := ComObject("WinHttp.WinHttpRequest.5.1")
        req.Open("GET", TriggerURL, true)   ; async, non bloquant
        req.Send()
    }
}

; Le hotkey n'EXISTE que si Premiere est actif ET qu'une image est copiée.
; Quand la condition est fausse, Ctrl+V garde son comportement natif.
#HotIf WinActive("ahk_exe Adobe Premiere Pro.exe") and ClipboardHasImage()
^v::FireTrigger()
#HotIf

; Petite info au survol de l'icône de la barre des tâches
A_IconTip := "Colle moi l'web — Ctrl+V dans Premiere"
