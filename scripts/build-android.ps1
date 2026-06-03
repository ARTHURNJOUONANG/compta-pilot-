# Build Android APK via Docker (Windows PowerShell)
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================"
Write-Host "  BUILD ANDROID - Docker local"
Write-Host "========================================"
Write-Host ""

try {
  docker info | Out-Null
} catch {
  Write-Host "Docker n'est pas demarre. Lancez Docker Desktop puis reessayez." -ForegroundColor Red
  exit 1
}
Write-Host "Docker est actif" -ForegroundColor Green

$envFile = Join-Path $ProjectRoot ".env.mobile"
if (Test-Path $envFile) {
  foreach ($line in (Get-Content $envFile)) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#")) { continue }
    $parts = $t -split "=", 2
    if ($parts.Count -lt 2) { continue }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($name) {
      Set-Item -Path ("Env:{0}" -f $name) -Value $value
    }
  }
  Write-Host "Variables .env.mobile chargees" -ForegroundColor Green
} else {
  Write-Host "Fichier .env.mobile absent — utilisez .env.mobile.example" -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path @(
  "generated\builds\apk",
  "generated\source\android"
) | Out-Null

Write-Host ""
Write-Host "Lancement du build Docker..."
Write-Host ""

$composeArgs = @(
  "-f", "docker/docker-compose.yml",
  "up",
  "--build",
  "--abort-on-container-exit",
  "--exit-code-from", "android-builder",
  "--remove-orphans"
)

if (Test-Path $envFile) {
  docker compose --env-file .env.mobile @composeArgs
} else {
  docker compose @composeArgs
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Build termine ! APK : generated/builds/apk/app-debug.apk" -ForegroundColor Green
