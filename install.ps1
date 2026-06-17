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
$ext = Join-Path $env:APPDATA "Adobe\CEP\extensions\PasteFromWeb"
if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }
Copy-Item (Join-Path $src "PasteFromWeb") $ext -Recurse -Force
Write-Host "  - Panneau installe"

# 2. Mode debug CEP (extensions non signees)
foreach ($v in 9,10,11,12) {
  New-Item -Path "HKCU:\Software\Adobe\CSXS.$v" -Force | Out-Null
  Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.$v" -Name PlayerDebugMode -Value "1"
}
Write-Host "  - Premiere autorise a charger le panneau"

# 3. Helper (raccourci Ctrl+V)
$hd = Join-Path $env:LOCALAPPDATA "ColleMoiWeb"
New-Item -ItemType Directory -Path $hd -Force | Out-Null
$startup = [Environment]::GetFolderPath('Startup')
$exe = Join-Path $src "Windows\ColleMoiWebHelper.exe"
$ahk = Join-Path $src "Windows\ColleMoiWebHelper.ahk"
if (Test-Path $exe) {
  Copy-Item $exe $hd -Force
  Copy-Item (Join-Path $hd "ColleMoiWebHelper.exe") $startup -Force
  Start-Process (Join-Path $hd "ColleMoiWebHelper.exe")
  Write-Host "  - Helper installe et lance"
} elseif (Test-Path $ahk) {
  Copy-Item $ahk $hd -Force
  Copy-Item (Join-Path $hd "ColleMoiWebHelper.ahk") $startup -Force
  try { Start-Process (Join-Path $hd "ColleMoiWebHelper.ahk") } catch {}
  Write-Host "  - Helper .ahk installe (necessite AutoHotkey v2)"
}

Write-Host ""
Write-Host "Termine ! (Re)lance Premiere -> Fenetre > Extensions > Colle moi l'web"
Write-Host "Copie une image, puis Ctrl+V dans la timeline."
