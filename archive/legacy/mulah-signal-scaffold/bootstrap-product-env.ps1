param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [Parameter(Mandatory = $true)]
    [string]$GitHubOwner,

    [string]$DefaultBranch = "main",
    [string]$DevelopBranch = "develop",
    [string]$NodeVersion = "20",
    [switch]$PrivateRepo = $false
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$CommandName, [string]$InstallHint)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $CommandName`n$InstallHint"
    }
}

function New-FileWithContent {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Append-IfMissing {
    param(
        [string]$Path,
        [string]$Content
    )
    if (-not (Test-Path $Path)) {
        Set-Content -Path $Path -Value $Content -Encoding UTF8
        return
    }

    $existing = Get-Content $Path -Raw
    if ($existing -notmatch [regex]::Escape($Content.Trim())) {
        Add-Content -Path $Path -Value "`r`n$Content"
    }
}

Write-Step "Checking required tools"
Assert-Command -CommandName "git" -InstallHint "Install Git for Windows first."
Assert-Command -CommandName "gh" -InstallHint "Install GitHub CLI first."
Assert-Command -CommandName "node" -InstallHint "Install Node.js LTS first."
Assert-Command -CommandName "npm" -InstallHint "Install Node.js LTS first."

Write-Step "Checking GitHub authentication"
$ghAuthOk = $false
try {
    gh auth status | Out-Null
    $ghAuthOk = $true
} catch {
    $ghAuthOk = $false
}

if (-not $ghAuthOk) {
    throw "GitHub CLI is not authenticated. Run: gh auth login ; then run: gh auth setup-git ; then re-run this script."
}

$Root = Join-Path (Get-Location) $ProjectName
if (Test-Path $Root) {
    throw "Folder already exists: $Root"
}

Write-Step "Creating monorepo folders"
$folders = @(
    "apps/web",
    "apps/mobile",
    "apps/admin",
    "services/api",
    "services/workers",
    "packages/ui",
    "packages/config",
    "packages/types",
    "packages/utils",
    "infra/scripts",
    "infra/docker",
    "docs/architecture",
    "docs/adr",
    ".github/workflows"
)

New-Item -ItemType Directory -Path $Root -Force | Out-Null
foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path (Join-Path $Root $folder) -Force | Out-Null
}

Write-Step "Creating baseline repo files"

$rootPackageJson = @"
{
  "name": "$ProjectName",
  "private": true,
  "packageManager": "pnpm@9",
  "workspaces": [
    "apps/*",
    "services/*",
    "packages/*"
  ],
  "scripts": {
    "lint": "echo `"Add root lint orchestration later`"",
    "typecheck": "echo `"Add root typecheck orchestration later`"",
    "test": "echo `"Add test orchestration later`"",
    "format": "echo `"Add formatting later`""
  }
}
"@

$pnpmWorkspace = @"
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
"@

$gitignore = @"
# Node
node_modules/
.pnpm-store/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Builds
dist/
build/
.next/
out/
coverage/

# Expo / React Native
.expo/
.expo-shared/
android/
ios/

# Python
__pycache__/
*.pyc
.venv/
venv/

# Env
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Vercel
.vercel/

# Logs
logs/
*.log
"@

$editorConfig = @"
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.py]
indent_size = 4
"@

$readme = @"
# $ProjectName

Monorepo for web, mobile, backend services, shared packages, infra scripts, and docs.

## Structure

- apps/web
- apps/mobile
- apps/admin
- services/api
- services/workers
- packages/ui
- packages/config
- packages/types
- packages/utils
- docs
- .github/workflows

## Branches

- $DefaultBranch = production-ready
- $DevelopBranch = integration branch
- feature/* = work branches

## Next steps

1. Scaffold apps/web
2. Scaffold apps/mobile
3. Scaffold services/api
4. Connect Vercel
5. Connect Expo EAS
6. Add secrets in GitHub / Vercel / hosting provider
"@

$ciWorkflow = @"
name: ci

on:
  pull_request:
  push:
    branches:
      - $DefaultBranch
      - $DevelopBranch

jobs:
  repo-health:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "$NodeVersion"

      - name: Print structure
        run: |
          echo "Repo initialized"
          ls -la
"@

$codeOwners = @"
* @$GitHubOwner
"@

$adrTemplate = @"
# ADR-0001: Initial Platform Decisions

## Status
Accepted

## Context
Initial engineering platform setup for solo-founder development with future team handoff.

## Decision
Use:
- GitHub as source of truth
- Cursor as primary IDE
- GitHub Actions for CI
- Vercel for web deployment
- Expo/EAS for mobile delivery
- Separate backend hosting provider

## Consequences
- Portable repo
- Clear handoff path
- Low platform lock-in
"@

$envExample = @"
# App
NODE_ENV=development

# Web
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# API
DATABASE_URL=
JWT_SECRET=

# Vercel / Expo / other
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
"@

$vercelHelper = @"
param(
  [string]`$AppPath = "apps/web"
)

`$ErrorActionPreference = "Stop"

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is not installed. Install it first with npm i -g vercel"
}

Push-Location `"$PSScriptRoot\..\..\$AppPath`"
try {
  vercel login
  vercel link --yes
} finally {
  Pop-Location
}
"@

$expoHelper = @"
param(
  [string]`$AppPath = "apps/mobile"
)

`$ErrorActionPreference = "Stop"

Push-Location `"$PSScriptRoot\..\..\$AppPath`"
try {
  npx eas-cli login
  npx eas-cli build:configure
} finally {
  Pop-Location
}
"@

New-FileWithContent -Path (Join-Path $Root "package.json") -Content $rootPackageJson
New-FileWithContent -Path (Join-Path $Root "pnpm-workspace.yaml") -Content $pnpmWorkspace
New-FileWithContent -Path (Join-Path $Root ".gitignore") -Content $gitignore
New-FileWithContent -Path (Join-Path $Root ".editorconfig") -Content $editorConfig
New-FileWithContent -Path (Join-Path $Root "README.md") -Content $readme
New-FileWithContent -Path (Join-Path $Root ".github/CODEOWNERS") -Content $codeOwners
New-FileWithContent -Path (Join-Path $Root ".github/workflows/ci.yml") -Content $ciWorkflow
New-FileWithContent -Path (Join-Path $Root "docs/adr/ADR-0001-initial-platform-decisions.md") -Content $adrTemplate
New-FileWithContent -Path (Join-Path $Root ".env.example") -Content $envExample
New-FileWithContent -Path (Join-Path $Root "infra/scripts/link-vercel.ps1") -Content $vercelHelper
New-FileWithContent -Path (Join-Path $Root "infra/scripts/configure-eas.ps1") -Content $expoHelper

Write-Step "Initializing git repo"
Push-Location $Root
try {
    git init
    git branch -M $DefaultBranch

    Write-Step "Creating placeholder app/service markers"
    New-FileWithContent -Path (Join-Path $Root "apps/web/README.md") -Content "# Web app"
    New-FileWithContent -Path (Join-Path $Root "apps/mobile/README.md") -Content "# Mobile app"
    New-FileWithContent -Path (Join-Path $Root "services/api/README.md") -Content "# API service"

    git add .
    git commit -m "chore: bootstrap monorepo foundation"

    Write-Step "Creating GitHub repository"
    $repoVisibility = if ($PrivateRepo) { "--private" } else { "--public" }
    gh repo create "$GitHubOwner/$ProjectName" $repoVisibility --source . --remote origin --push

    Write-Step "Creating develop branch"
    git checkout -b $DevelopBranch
    git push -u origin $DevelopBranch
    git checkout $DefaultBranch

    Write-Step "Applying basic branch protection to main"
    $protectionBody = @{
        required_status_checks = $null
        enforce_admins = $true
        required_pull_request_reviews = @{
            dismiss_stale_reviews = $true
            require_code_owner_reviews = $false
            required_approving_review_count = 1
        }
        restrictions = $null
        allow_force_pushes = $false
        allow_deletions = $false
        required_linear_history = $true
    } | ConvertTo-Json -Depth 10

Write-Step "Applying basic branch protection to main"

$protectionBody = @{
    required_status_checks = $null
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
        required_approving_review_count = 1
    }
    restrictions = $null
    allow_force_pushes = $false
    allow_deletions = $false
    required_linear_history = $true
} | ConvertTo-Json -Depth 10

$tempProtectionFile = Join-Path $env:TEMP "github-branch-protection.json"
Set-Content -Path $tempProtectionFile -Value $protectionBody -Encoding UTF8

gh api `
  --method PUT `
  -H "Accept: application/vnd.github+json" `
  "/repos/$GitHubOwner/$ProjectName/branches/$DefaultBranch/protection" `
  --input $tempProtectionFile

Remove-Item $tempProtectionFile -Force

    Write-Step "Done"
    Write-Host ""
    Write-Host "Repo created: https://github.com/$GitHubOwner/$ProjectName" -ForegroundColor Green
    Write-Host "Local path: $Root" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next manual commands:" -ForegroundColor Yellow
    Write-Host "1. cd `"$Root`""
    Write-Host "2. Scaffold apps/web"
    Write-Host "3. Scaffold apps/mobile"
    Write-Host "4. Run .\infra\scripts\link-vercel.ps1"
    Write-Host "5. Run .\infra\scripts\configure-eas.ps1"
}
finally {
    Pop-Location
}