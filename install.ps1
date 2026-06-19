# Colle moi l'web — installation Windows (lancée à distance via le .bat)
# >>> NON TESTÉ sur un vrai PC <<<
$ErrorActionPreference = 'Stop'
Write-Host "=== Installation de Colle moi l'web ==="

$tmp = Join-Path $env:TEMP ("cmw_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$zip = Join-Path $tmp "cmw.zip"

Write-Host "  - Telechargement..."
Invoke-WebRequest "https://github.com/SalashPyta/colle-moi-l-web/releases/latest/download/Colle-moi-l-web.zip" -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$src = Join-Path $tmp "Colle moi l'web"

# 1. Panneau CEP
$extDir = Join-Path $env:APPDATA "Adobe\CEP\extensions"
New-Item -ItemType Directory -Path $extDir -Force | Out-Null   # cree les dossiers parents si absents
$ext = Join-Path $extDir "PasteFromWeb"
if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }
Copy-Item (Join-Path $src "PasteFromWeb") $ext -Recurse -Force
Write-Host "  - Panneau installe"

# 2. Mode debug CEP (extensions non signees)
foreach ($v in 9,10,11,12) {
  New-Item -Path "HKCU:\Software\Adobe\CSXS.$v" -Force | Out-Null
  Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.$v" -Name PlayerDebugMode -Value "1"
}
Write-Host "  - Premiere autorise a charger le panneau"

# 3. Helper (raccourci Ctrl+V) — AutoHotkey PORTABLE, aucune installation requise
$hd = Join-Path $env:LOCALAPPDATA "ColleMoiWeb"
New-Item -ItemType Directory -Path $hd -Force | Out-Null
$startup = [Environment]::GetFolderPath('Startup')

# copier le script du helper
Copy-Item (Join-Path $src "Windows\ColleMoiWebHelper.ahk") $hd -Force
$ahkScript = Join-Path $hd "ColleMoiWebHelper.ahk"

# récupérer AutoHotkey64.exe (portable) si absent
$ahkExe = Join-Path $hd "AutoHotkey64.exe"
if (-not (Test-Path $ahkExe)) {
  Write-Host "  - Telechargement d'AutoHotkey (portable, sans installation)..."
  try {
    $ahkZip = Join-Path $env:TEMP "ahk2.zip"
    Invoke-WebRequest "https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.18/AutoHotkey_2.0.18.zip" -OutFile $ahkZip
    $ahkTmp = Join-Path $env:TEMP ("ahk2_" + [guid]::NewGuid().ToString())
    Expand-Archive -Path $ahkZip -DestinationPath $ahkTmp -Force
    $found = Get-ChildItem -Path $ahkTmp -Recurse -Filter "AutoHotkey64.exe" | Select-Object -First 1
    if ($found) { Copy-Item $found.FullName $ahkExe -Force }
    Remove-Item $ahkTmp -Recurse -Force -ErrorAction SilentlyContinue
  } catch {
    Write-Host "  /!\ Telechargement AutoHotkey echoue : $_"
  }
}

if (Test-Path $ahkExe) {
  # lancer maintenant
  Start-Process $ahkExe -ArgumentList "`"$ahkScript`""
  # lancement automatique a chaque ouverture de session (via un .cmd dans Startup)
  $startupCmd = Join-Path $startup "ColleMoiWeb.cmd"
  "@start `"`" `"$ahkExe`" `"$ahkScript`"" | Out-File -FilePath $startupCmd -Encoding ASCII
  Write-Host "  - Helper installe et lance (AutoHotkey portable) ✓"
} else {
  Write-Host "  /!\ AutoHotkey indisponible : le Ctrl+V global ne marchera pas."
  Write-Host "      Mais le BOUTON du panneau dans Premiere fonctionne quand meme."
}

Write-Host ""
Write-Host "Termine ! (Re)lance Premiere -> Fenetre > Extensions > Colle moi l'web"
Write-Host "Copie une image, puis Ctrl+V dans la timeline (ou clique le bouton du panneau)."
