# Démarre Compta Pilot avec Docker (Windows)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path ".env.docker")) {
    Copy-Item ".env.docker.example" ".env.docker"
    Write-Host ".env.docker cree — modifiez SESSION_SECRET puis relancez." -ForegroundColor Yellow
    exit 0
}

Write-Host "Verification Docker..."
docker version *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker ne repond pas. Ouvrez Docker Desktop, attendez qu'il soit pret (icone verte), puis relancez."
}

$env:COMPOSE_BAKE = "false"

Write-Host "Build + demarrage (5-15 min la premiere fois)..."
docker compose build app
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build Docker echoue. Solutions :" -ForegroundColor Yellow
    Write-Host "  1. Redemarrer Docker Desktop"
    Write-Host "  2. Settings > Docker Engine > reinitialiser"
    Write-Host "  3. En attendant : npm run dev (sans Docker)"
    exit 1
}

docker compose up -d app
Write-Host ""
Write-Host "OK — http://localhost:3000" -ForegroundColor Green
Write-Host "Emails test : docker compose --profile mail up -d  puis http://localhost:8025"
