param(
  [string]$AppPath = "apps/web"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is not installed. Install it first with npm i -g vercel"
}

Push-Location "C:\Users\eamon\Personal Projects\apps\..\..\"
try {
  vercel login
  vercel link --yes
} finally {
  Pop-Location
}
