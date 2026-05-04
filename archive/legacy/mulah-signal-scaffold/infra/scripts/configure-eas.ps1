param(
  [string]$AppPath = "apps/mobile"
)

$ErrorActionPreference = "Stop"

Push-Location "C:\Users\eamon\Personal Projects\apps\..\..\"
try {
  npx eas-cli login
  npx eas-cli build:configure
} finally {
  Pop-Location
}
