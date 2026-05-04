param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [Parameter(Mandatory = $true)]
    [string]$GitHubOwner,

    [string]$DefaultBranch = "main"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$CommandName)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $CommandName"
    }
}

Write-Step "Checking required tools"
Assert-Command "gh"
Assert-Command "git"

Write-Step "Checking GitHub authentication"
try {
    gh auth status | Out-Null
} catch {
    throw "GitHub CLI is not authenticated. Run: gh auth login"
}

Write-Step "Verifying GitHub repository exists"
gh repo view "$GitHubOwner/$ProjectName" | Out-Null

Write-Step "Applying branch protection to $DefaultBranch"

$protectionBody = @{
    required_status_checks = @{
        strict = $false
        contexts = @()
    }
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
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tempProtectionFile, $protectionBody, $utf8NoBom)

try {
    gh api `
      --method PUT `
      -H "Accept: application/vnd.github+json" `
      -H "X-GitHub-Api-Version: 2022-11-28" `
      "/repos/$GitHubOwner/$ProjectName/branches/$DefaultBranch/protection" `
      --input $tempProtectionFile
}
finally {
    if (Test-Path $tempProtectionFile) {
        Remove-Item $tempProtectionFile -Force
    }
}

Write-Step "Done"
Write-Host ""
Write-Host "Branch protection applied to $GitHubOwner/$ProjectName ($DefaultBranch)." -ForegroundColor Green
Write-Host ""
Write-Host "Next recommended steps:" -ForegroundColor Yellow
Write-Host "1. cd `"C:\Users\eamon\Personal Projects\apps\$ProjectName`""
Write-Host "2. Open the repo in Cursor"
Write-Host "3. Scaffold apps/web"
Write-Host "4. Scaffold apps/mobile"
Write-Host "5. Scaffold services/api"