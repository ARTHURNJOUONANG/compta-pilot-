# Remplace DOSSIER-COMPLET.html par la version avec user stories
# Fermez d'abord DOSSIER-COMPLET.html dans Cursor et le navigateur.

$ErrorActionPreference = "Stop"
$docs = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $docs "DOSSIER-COMPLET-UPDATED.html"
$dst = Join-Path $docs "DOSSIER-COMPLET.html"

if (-not (Test-Path $src)) {
    Write-Error "Fichier source introuvable : $src"
}

try {
    Copy-Item -Force $src $dst
    Write-Host "OK — DOSSIER-COMPLET.html mis a jour (user stories section 10)." -ForegroundColor Green
    Write-Host "Ouvrez $dst puis Ctrl+P pour le PDF."
} catch {
    Write-Host "Echec : fermez DOSSIER-COMPLET.html dans Cursor / navigateur, puis relancez :" -ForegroundColor Yellow
    Write-Host "  .\docs\replace-dossier.ps1"
    Write-Host ""
    Write-Host "En attendant, utilisez : docs\DOSSIER-COMPLET-UPDATED.html" -ForegroundColor Cyan
    exit 1
}
