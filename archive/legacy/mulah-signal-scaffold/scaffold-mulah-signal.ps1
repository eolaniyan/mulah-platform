param(
    [string]$ProjectRoot = "C:\Users\eamon\Personal Projects\apps\mulah-signal",
    [string]$ApiPort = "8000"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$CommandName, [string]$Hint = "")
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        if ($Hint) {
            throw "Missing required command: $CommandName`n$Hint"
        }
        throw "Missing required command: $CommandName"
    }
}

function Remove-IfExists {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force
    }
}

function New-FileUtf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

Write-Step "Checking required tools"
Assert-Command git
Assert-Command node
Assert-Command npm
Assert-Command pnpm "Install with: npm install -g pnpm"
Assert-Command python "Install Python 3.12+ and ensure it is on PATH"

if (-not (Test-Path $ProjectRoot)) {
    throw "Project root not found: $ProjectRoot"
}

$webPath = Join-Path $ProjectRoot "apps\web"
$mobilePath = Join-Path $ProjectRoot "apps\mobile"
$apiPath = Join-Path $ProjectRoot "services\api"

Write-Step "Verifying target folders"
if (-not (Test-Path $webPath)) { throw "Missing folder: $webPath" }
if (-not (Test-Path $mobilePath)) { throw "Missing folder: $mobilePath" }
if (-not (Test-Path $apiPath)) { throw "Missing folder: $apiPath" }

Push-Location $ProjectRoot
try {
    Write-Step "Scaffolding Next.js app in apps/web"
    $webItems = @(Get-ChildItem $webPath -Force -ErrorAction SilentlyContinue)
    $webHasRealFiles = ($webItems | Where-Object { $_.Name -ne "README.md" }).Count -gt 0

    if (-not $webHasRealFiles) {
        Remove-IfExists $webPath
        pnpm create next-app@latest apps/web --typescript --eslint --app --src-dir --use-pnpm --import-alias "@/*"
    }
    else {
        Write-Host "apps/web already contains files. Skipping Next.js scaffold." -ForegroundColor Yellow
    }

    Write-Step "Scaffolding Expo app in apps/mobile"
    $mobileItems = @(Get-ChildItem $mobilePath -Force -ErrorAction SilentlyContinue)
    $mobileHasRealFiles = ($mobileItems | Where-Object { $_.Name -ne "README.md" }).Count -gt 0

    if (-not $mobileHasRealFiles) {
        Remove-IfExists $mobilePath
        npx create-expo-app@latest apps/mobile --template default
    }
    else {
        Write-Host "apps/mobile already contains files. Skipping Expo scaffold." -ForegroundColor Yellow
    }

    Write-Step "Creating FastAPI service in services/api"
    $apiItems = @(Get-ChildItem $apiPath -Force -ErrorAction SilentlyContinue)
    $apiHasRealFiles = ($apiItems | Where-Object { $_.Name -ne "README.md" }).Count -gt 0

    if (-not $apiHasRealFiles) {
        New-Item -ItemType Directory -Path (Join-Path $apiPath "app") -Force | Out-Null

        $requirements = @"
fastapi
uvicorn[standard]
"@

        $mainPy = @"
from fastapi import FastAPI

app = FastAPI(title="mulah-signal-api", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}
"@

        $envExample = @"
PORT=$ApiPort
"@

        $apiReadme = @"
# API service

## Local setup

python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port $ApiPort
"@

        New-FileUtf8NoBom -Path (Join-Path $apiPath "requirements.txt") -Content $requirements
        New-FileUtf8NoBom -Path (Join-Path $apiPath "app\main.py") -Content $mainPy
        New-FileUtf8NoBom -Path (Join-Path $apiPath ".env.example") -Content $envExample
        New-FileUtf8NoBom -Path (Join-Path $apiPath "README.md") -Content $apiReadme

        Push-Location $apiPath
        try {
            python -m venv .venv
            & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
            & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Host "services/api already contains files. Skipping FastAPI scaffold." -ForegroundColor Yellow
    }

    Write-Step "Writing root helper files"

    $rootEnvExample = @"
# Web
NEXT_PUBLIC_API_BASE_URL=http://localhost:$ApiPort

# Mobile
EXPO_PUBLIC_API_BASE_URL=http://localhost:$ApiPort

# API
PORT=$ApiPort
"@

    $runWeb = @"
param()
Set-Location "$ProjectRoot"
pnpm --dir apps/web dev
"@

    $runMobile = @"
param()
Set-Location "$ProjectRoot"
Set-Location ".\apps\mobile"
npx expo start --clear
"@

    $runApi = @"
param()
Set-Location "$apiPath"
& ".\.venv\Scripts\uvicorn.exe" app.main:app --reload --port $ApiPort
"@

    $devReadme = @"
# Local development

## Web
.\infra\scripts\run-web.ps1

## Mobile
.\infra\scripts\run-mobile.ps1

## API
.\infra\scripts\run-api.ps1
"@

    New-FileUtf8NoBom -Path (Join-Path $ProjectRoot ".env.example") -Content $rootEnvExample
    New-FileUtf8NoBom -Path (Join-Path $ProjectRoot "infra\scripts\run-web.ps1") -Content $runWeb
    New-FileUtf8NoBom -Path (Join-Path $ProjectRoot "infra\scripts\run-mobile.ps1") -Content $runMobile
    New-FileUtf8NoBom -Path (Join-Path $ProjectRoot "infra\scripts\run-api.ps1") -Content $runApi
    New-FileUtf8NoBom -Path (Join-Path $ProjectRoot "docs\architecture\LOCAL_DEVELOPMENT.md") -Content $devReadme

    Write-Step "Installing workspace dependencies"
    pnpm install

    Write-Step "Done"
    Write-Host ""
    Write-Host "Scaffolding complete." -ForegroundColor Green
    Write-Host "Project root: $ProjectRoot" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next commands:" -ForegroundColor Yellow
    Write-Host "1. cd `"$ProjectRoot`""
    Write-Host "2. .\infra\scripts\run-api.ps1"
    Write-Host "3. Open a new terminal and run .\infra\scripts\run-web.ps1"
    Write-Host "4. Open a new terminal and run .\infra\scripts\run-mobile.ps1"
    Write-Host "5. git checkout -b feature/initial-scaffold"
    Write-Host "6. git add ."
    Write-Host "7. git commit -m `"feat: scaffold web mobile api`""
}
finally {
    Pop-Location
}